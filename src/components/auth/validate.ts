// Lightweight client-side checks shared by the auth screens. Server-side
// validation is still the source of truth; these just guide the user.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string) => EMAIL_RE.test(value.trim());

export const MIN_PASSWORD_LENGTH = 8;
