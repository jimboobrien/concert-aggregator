export type SessionUser = { id: string };

export function hasSessionUser(
  user: { id?: string } | null | undefined
): user is SessionUser {
  return typeof user?.id === 'string' && user.id.length > 0;
}
