const DEFAULT_NEXT = '/';

/**
 * Allow only same-origin relative paths after OAuth / magic-link callback.
 *
 * `/auth/callback` concatenates `origin + next`. Values like `@evil.com`
 * parse as `https://victim@evil.com` (userinfo@host), so an unchecked `next`
 * is an open redirect off a trusted login.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_NEXT
): string {
  if (typeof raw !== 'string') return fallback;
  const next = raw.trim();
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (next.includes('\\') || next.includes('://')) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(next)) return fallback;
  return next;
}
