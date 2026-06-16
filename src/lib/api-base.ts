/** Resolve API base URL for client and server-side fetches. */
export function getApiBase(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (publicUrl && !publicUrl.startsWith('/')) {
    return publicUrl
  }
  // Browser: same-origin /v1/* proxied by Next.js rewrites to BUILD_API_URL.
  if (typeof window !== 'undefined') {
    return ''
  }
  return process.env.BUILD_API_URL?.trim()?.replace(/\/$/, '') || 'http://localhost:8090'
}
