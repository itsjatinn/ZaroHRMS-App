// Lightweight client-side checks shared by the auth screens. Server-side
// validation is still the source of truth; these just guide the user.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value?: string | null) =>
  EMAIL_RE.test((value ?? '').trim());

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Mirrors the backend's STRONG_PASSWORD_PATTERN (auth/password-policy.ts).
 * Kept in step deliberately: the server rejects anything weaker, so checking
 * only the length here would let the user submit and get a 400 back with
 * requirements they were never shown.
 */
const STRONG_PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;

export const STRONG_PASSWORD_MESSAGE =
  'Use 8-128 characters with an uppercase letter, a lowercase letter, a number and a symbol.';

export const isStrongPassword = (value?: string | null) =>
  STRONG_PASSWORD_RE.test(value ?? '');

// Tenant slugs are lowercase alphanumeric with inner hyphens, matching what the
// web signup allows (e.g. "zaro", "acme-corp").
const ORG_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Canonical form sent to the backend: trimmed and lowercased. */
export const normalizeOrgSlug = (value?: string | null) =>
  (value ?? '').trim().toLowerCase();

export const isValidOrgSlug = (value?: string | null) =>
  ORG_SLUG_RE.test(normalizeOrgSlug(value));
