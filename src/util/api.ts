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

/**
 * Remove the remote prefix from the string. If there is no prefix, returns
 * null. E.g.:
 *
 * origin/my-branch       -> my-branch
 * origin/thing/my-branch -> thing/my-branch
 * my-branch              -> null
 */
export function removeRemotePrefix(name: string): string | undefined {
  const pieces = name.match(/.*?\/(.*)/)
  if (!pieces || pieces.length < 2) {
     return undefined
  }

  return pieces[1]
}