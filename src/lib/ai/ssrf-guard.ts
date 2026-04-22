/**
 * SSRF Guard — validates URLs before they are used in fetch() calls.
 *
 * Blocks:
 * - localhost, 127.0.0.1, ::1
 * - 169.254.x.x (AWS/GCP/Azure metadata endpoints)
 * - link-local addresses (169.254.0.0/16)
 * - private IP ranges: 10.x, 172.16-31.x, 192.168.x
 * - non-HTTP(S) schemes
 */

export class SSRFError extends Error {
  constructor(hostname: string) {
    super(`SSRF blocked: hostname "${hostname}" resolves to a disallowed address`)
    this.name = 'SSRFError'
  }
}

function isPrivateHost(host: string): boolean {
  // String hostname matches
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0') return true

  // IPv4-mapped IPv6 ::ffff:127.0.0.1
  if (host.startsWith('::ffff:')) {
    const inner = host.slice(7)
    if (inner === '127.0.0.1') return true
  }

  // Direct IP matches
  if (host === '127.0.0.1') return true

  // Link-local (169.254.x.x) — includes AWS metadata 169.254.169.254
  if (/^169\.254\./.test(host)) return true

  // 10.x.x.x
  if (/^10\./.test(host)) return true

  // 172.16-31.x.x
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true

  // 192.168.x.x
  if (/^192\.168\./.test(host)) return true

  return false
}

function isInvalidScheme(url: string): boolean {
  try {
    const parsed = new URL(url)
    const scheme = parsed.protocol.toLowerCase()
    return scheme !== 'http:' && scheme !== 'https:'
  } catch {
    // If URL parsing fails, assume invalid and let the caller handle it
    return true
  }
}

/**
 * Validates a URL for SSRF risks before fetch().
 * Throws SSRFError if the hostname is a disallowed internal address.
 */
export function validateURLForSSRF(url: string): void {
  if (isInvalidScheme(url)) {
    throw new SSRFError(url)
  }

  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    throw new SSRFError(url)
  }

  if (isPrivateHost(hostname)) {
    throw new SSRFError(hostname)
  }
}