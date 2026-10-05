/**
 * Domain-match lookup must not replace a venue's stored scrape URL.
 * Only fill it in when the catalog row has no URL yet.
 */
export function shouldFillMissingVenueUrl(
  existingUrl: string | null | undefined
): boolean {
  return existingUrl == null || existingUrl.trim() === '';
}
