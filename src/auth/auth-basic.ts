import * as os from 'os';
import { getDotComAPIEndpoint } from '../core/api';
import { Response } from 'node-fetch';
import { deserialize, request } from '../core/http';
import { Account } from '../model/account';

const uuid = require('uuid/v4');
const username = require('username');
const Octokat = require('octokat');

/**
 * The note URL used for authorizations the app creates.
 */
const NoteURL = 'https://github.com/TypeFox/dugite-extra'

/**
 * The OAuth scopes we need.
 */
const Scopes = ['repo', 'user'];

/**
 * When authentication is requested via 2FA, the endpoint provides
 * a hint in the response header as to where the user should look
 * to retrieve the token.
 */
export enum AuthenticationMode {
    /*
     * User should authenticate via a received text message.
     */
    Sms,
    /*
     * User should open TOTP mobile application and obtain code.
     */
    App
}

export enum AuthorizationResponseKind {
    Authorized,
    Failed,
    TwoFactorAuthenticationRequired,
    UserRequiresVerification,
    PersonalAccessTokenBlocked,
    Error,
    EnterpriseTooOld,
}

export type AuthorizationResponse = { kind: AuthorizationResponseKind.Authorized, token: string } |
    { kind: AuthorizationResponseKind.Failed, response: Response } |
    { kind: AuthorizationResponseKind.TwoFactorAuthenticationRequired, type: AuthenticationMode } |
    { kind: AuthorizationResponseKind.Error, response: Response } |
    { kind: AuthorizationResponseKind.UserRequiresVerification } |
    { kind: AuthorizationResponseKind.PersonalAccessTokenBlocked } |
    { kind: AuthorizationResponseKind.EnterpriseTooOld }
/**
 * The structure of error messages returned from the GitHub API.
 *
 * Details: https://developer.github.com/v3/#client-errors
 */
interface IError {
    readonly message: string
    readonly resource: string
    readonly field: string
}

/**
 * The partial server response when an error has been returned.
 *
 * Details: https://developer.github.com/v3/#client-errors
 */
interface IAPIError {
    readonly errors?: IError[]
    readonly message?: string
}

/** The partial server response when creating a new authorization on behalf of a user */
interface IAPIAuthorization {
    readonly token: string
}

/**
 * Information about a user's email as returned by the GitHub API.
 */
export interface IAPIEmail {
    readonly email: string
    readonly verified: boolean
    readonly primary: boolean
    /**
     * `null` can be returned by the API for legacy reasons. A non-null value is
     * set for the primary email address currently, but in the future visibility
     * may be defined for each email address.
     */
    readonly visibility: 'public' | 'private' | undefined
}

export async function authenticateWithBasicAuth(username: string, password: string, endpoint: string = getDotComAPIEndpoint()): Promise<Account> {
    const response = await createAuthorization(endpoint, username, password, undefined);
    if (response.kind === AuthorizationResponseKind.Authorized) {
        return await fetchUser(endpoint, response.token);
    }
    return Promise.reject(new Error('Basic authentication failed.'));
}

/** Fetch the user authenticated by the token. */
export async function fetchUser(endpoint: string, token: string): Promise<Account> {
    const octo = new Octokat({ token, rootURL: endpoint })
    const user = await octo.user.fetch()

    const isDotCom = endpoint === getDotComAPIEndpoint()

    // workaround for /user/public_emails throwing a 500
    // while we investigate the API issue
    // see https://github.com/desktop/desktop/issues/1508 for context
    let emails: ReadonlyArray<IAPIEmail> = []
    try {
        const result = isDotCom
            ? await octo.user.publicEmails.fetch()
            // GitHub Enterprise does not have the concept of private emails
            : await octo.user.emails.fetch()
        emails = result && Array.isArray(result.items)
            ? result.items as ReadonlyArray<IAPIEmail>
            : []
    } catch (e) {
        emails = []
    }

    return {
        login: user.login,
        endpoint,
        token,
        emails,
        avatarURL: user.avatarURL,
        id: user.id,
        name: user.name
    };
}

/**
 * Create an authorization with the given login, password, and one-time
 * password.
 */
export async function createAuthorization(endpoint: string, login: string, password: string, oneTimePassword: string | undefined): Promise<AuthorizationResponse> {
    const creds = Buffer.from(`${login}:${password}`, 'utf8').toString('base64')
    const authorization = `Basic ${creds}`
    const headers = oneTimePassword ? { 'X-GitHub-OTP': oneTimePassword } : {}

    const note = await getNote()

    const response = await request(endpoint, authorization, 'POST', 'authorizations', {
        'scopes': Scopes,
        'note': note,
        'note_url': NoteURL,
        'fingerprint': uuid(),
    }, headers)

    if (response.status === 401) {
        const otpResponse = response.headers.get('x-github-otp')
        if (otpResponse) {
            const pieces = otpResponse.split(';')
            if (pieces.length === 2) {
                const type = pieces[1].trim()
                switch (type) {
                    case 'app':
                        return { kind: AuthorizationResponseKind.TwoFactorAuthenticationRequired, type: AuthenticationMode.App }
                    case 'sms':
                        return { kind: AuthorizationResponseKind.TwoFactorAuthenticationRequired, type: AuthenticationMode.Sms }
                    default:
                        return { kind: AuthorizationResponseKind.Failed, response }
                }
            }
        }

        return { kind: AuthorizationResponseKind.Failed, response }
    }

    if (response.status === 403) {
        const apiError = await deserialize<IAPIError>(response)
        if (apiError && apiError.message === 'This API can only be accessed with username and password Basic Auth') {
            // Authorization API does not support providing personal access tokens
            return { kind: AuthorizationResponseKind.PersonalAccessTokenBlocked }
        }

        return { kind: AuthorizationResponseKind.Error, response }
    }

    if (response.status === 422) {
        const apiError = await deserialize<IAPIError>(response)
        if (apiError) {
            if (apiError.errors) {
                for (const error of apiError.errors) {
                    const isExpectedResource = error.resource.toLowerCase() === 'oauthaccess'
                    const isExpectedField = error.field.toLowerCase() === 'user'
                    if (isExpectedField && isExpectedResource) {
                        return { kind: AuthorizationResponseKind.UserRequiresVerification }
                    }
                }
            } else if (apiError.message === 'Invalid OAuth application client_id or secret.') {
                return { kind: AuthorizationResponseKind.EnterpriseTooOld }
            }
        }

        return { kind: AuthorizationResponseKind.Error, response }
    }

    const body = await deserialize<IAPIAuthorization>(response)
    if (body) {
        const token = body.token
        if (token && typeof token === 'string' && token.length) {
            return { kind: AuthorizationResponseKind.Authorized, token }
        }
    }

    return { kind: AuthorizationResponseKind.Error, response }
}

/** The note used for created authorizations. */
async function getNote(): Promise<string> {
    let localUsername = 'unknown'
    try {
        localUsername = await username()
    } catch (e) {
        console.error(`getNote: unable to resolve machine username, using '${localUsername}' as a fallback`, e);
    }

    return `dugite-extra on ${localUsername}@${os.hostname()}`
}