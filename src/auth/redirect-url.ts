export const AUTH_CALLBACK_PATH = '/auth/callback';

export function getAuthCallbackUrl(origin = window.location.origin): string {
  const base = new URL(origin);
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    throw new Error('Authentication redirects require an HTTP or HTTPS origin.');
  }
  return new URL(AUTH_CALLBACK_PATH, base).toString();
}
