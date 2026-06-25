// Hardcoded demo login for development / showcase builds. Replace this check
// with a real API call in sign-in.tsx when the backend is ready.
export const DEMO_CREDENTIALS = {
  organization: 'zaro',
  email: 'admin@zaro.com',
  password: 'zaro1234',
} as const;

// Case-insensitive match on org + email, exact match on password.
export function isDemoLogin(
  organization: string,
  email: string,
  password: string,
) {
  return (
    organization.trim().toLowerCase() === DEMO_CREDENTIALS.organization &&
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}
