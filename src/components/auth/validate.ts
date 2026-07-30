// Lightweight client-side checks shared by the auth screens. Server-side
// validation is still the source of truth; these just guide the user.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value?: string | null) =>
  EMAIL_RE.test((value ?? '').trim());

export const MIN_PASSWORD_LENGTH = 8;

// Tenant slugs are lowercase alphanumeric with inner hyphens, matching what the
// web signup allows (e.g. "zaro", "acme-corp").
const ORG_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Canonical form sent to the backend: trimmed and lowercased. */
export const normalizeOrgSlug = (value?: string | null) =>
  (value ?? '').trim().toLowerCase();

export const isValidOrgSlug = (value?: string | null) =>
  ORG_SLUG_RE.test(normalizeOrgSlug(value));
