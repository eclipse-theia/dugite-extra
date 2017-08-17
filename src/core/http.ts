import { Request, RequestInit, Response } from 'node-fetch';
const URL = require('url').URL;
const fetch: (url: string | Request, init?: RequestInit) => Promise<Response> = require('node-fetch');
const __DARWIN__: boolean = require('is-osx');

/** The HTTP methods available. */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'HEAD'

/**
 *
 * Note: this doesn't validate the expected shape, and will only fail
 * if it encounters invalid JSON
 */
export async function deserialize<T>(response: Response | string): Promise<T | undefined> {
    try {
        if (response instanceof Response) {
            const json = await response.json()
            return json as T
        } else {
            const json = await JSON.parse(response)
            return json as T
        }
    } catch (e) {
        console.error(`Unable to deserialize JSON string to object ${response}`, e)
        return undefined;
    }
}

/**
 * Make an API request.
 *
 * @param endpoint      - The API endpoint.
 * @param authorization - The value to pass in the `Authorization` header.
 * @param method        - The HTTP method.
 * @param path          - The path, including any query string parameters.
 * @param body          - The body to send.
 * @param customHeaders - Any optional additional headers to send.
 */
export function request(endpoint: string, authorization: string | undefined, method: HTTPMethod, path: string, body?: Object, customHeaders?: Object): Promise<Response> {
    const url = new URL(path, endpoint)

    const headers: any = Object.assign({}, {
        'Accept': 'application/vnd.github.v3+json, application/json',
        'Content-Type': 'application/json'
    }, customHeaders)

    if (authorization) {
        headers['Authorization'] = authorization
    }

    const options = {
        headers,
        method,
        body: JSON.stringify(body),
    }

    return fetch(url.href, options)
}

/** Get the user agent to use for all requests. */
export function getUserAgent() {
    const platform = __DARWIN__ ? 'Macintosh' : 'Windows';
    const version = require('../../package.json').version;
    return `dugite-extra/${version} (${platform})`
}