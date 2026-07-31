/**
 * Initials fallback for an avatar with no photo — the same derivation the web's
 * ProfileAvatar uses, so the two products fall back to the same two letters.
 *
 * Showing initials matters here: the alternative is a stock sample portrait,
 * which reads as "this is your photo" for a face the employee has never seen.
 */
export function getInitials(name?: string | null, email?: string | null) {
  const source =
    (name ?? '').trim() || String(email ?? '').split('@')[0] || 'ZR';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
