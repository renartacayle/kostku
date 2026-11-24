/**
 * Utility to decode standard Google Identity Services JWT credentials
 * without heavy external dependencies.
 */
export function decodeGoogleCredential(credential) {
  if (!credential || typeof credential !== 'string') return null;
  try {
    const parts = credential.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonStr;
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      const decoded = window.atob(base64);
      jsonStr = decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      return null;
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('[decodeGoogleCredential] Failed to parse JWT payload:', err);
    return null;
  }
}
