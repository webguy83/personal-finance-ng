/**
 * Generates a deterministic DiceBear initials avatar URL from a name.
 * Same name always returns the same avatar — no storage required.
 *
 * Uses the DiceBear "initials" HTTP API:
 * https://www.dicebear.com/styles/initials/
 */
export function avatarUrl(name: string): string {
  const url = new URL('https://api.dicebear.com/9.x/initials/svg');
  url.searchParams.set('seed', name.trim());
  url.searchParams.set('backgroundType', 'solid');
  url.searchParams.set('backgroundColor', '277C78,626070,82C9D7,826CB0,C94736,93674F,3F82B2,7F9161');
  url.searchParams.set('fontFamily', 'Arial');
  url.searchParams.set('fontSize', '40');
  url.searchParams.set('fontWeight', '700');
  return url.href;
}
