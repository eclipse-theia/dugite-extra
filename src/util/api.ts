/**
 * Gets the `github.com` API endpoint.
 */
export function getDotComAPIEndpoint(): string {
    if (typeof process !== 'undefined') {
        const envEndpoint = process.env['API_ENDPOINT']
        if (envEndpoint && envEndpoint.length > 0) {
            return envEndpoint
        }
    }
    return 'https://api.github.com'
}