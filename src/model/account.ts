import { Email } from './email'
import { getDotComAPIEndpoint } from '../util/api'

/**
 * A GitHub account, representing the user found on GitHub or GitHub Enterprise.
 *
 * This contains a token that will be used for operations that require authentication.
 */
export interface Account {

    /**
     * The access token used to perform operations on behalf of this account.
     */
    readonly token: string;

    /**
     * The login name for this account
     */
    readonly login: string;

    /**
     * The current list of email addresses associated with the account.
     */
    readonly endpoint: string;

    /**
     * The current list of email addresses associated with the account.
     */
    readonly emails: ReadonlyArray<Email>;

    /**
     * The profile URL to render for this account.
     */
    readonly avatarURL: string;

    /**
     * The database id for this account.
     */
    readonly id: number
    
    /**
     * The friendly name associated with this account.
     */
    readonly name: string
}

export namespace Account {

    /**
     * Create an account which can be used to perform unauthenticated API actions.
     */
    export function anonymous(): Account {
        return {
            login: '',
            endpoint: getDotComAPIEndpoint(),
            token: '', 
            emails: [],
            avatarURL: '',
            id: -1,
            name: ''
        };
    }

    /**
     * Copies the `account` argument and sets the authentication token on it.
     * 
     * @param account the account to set the token on it.
     * @param token the token to set.
     */
    export function withToken(account: Account, token: string): Account {
        return Object.assign(account, {
            token
        }) as Account;
    }

}