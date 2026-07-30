// Hardcoded demo login for development / showcase builds. Replace this check
// with a real API call in sign-in.tsx when the backend is ready.
export type UserRole = 'employee' | 'manager';

export const DEMO_CREDENTIALS = {
  employee: {
    organization: 'zaro', email: 'employee@zarohr.com', password: '123456789', role: 'employee',
  },
  manager: {
    organization: 'zaro', email: 'manager@zarohr.com', password: '123456789', role: 'manager',
  },
} as const;

// Case-insensitive match on org + email, exact match on password.
export function authenticateDemoLogin(
  organization: string,
  email: string,
  password: string,
): UserRole | null {
  const normalizedOrganization = organization.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const credential = Object.values(DEMO_CREDENTIALS).find(
    (item) => normalizedOrganization === item.organization && normalizedEmail === item.email && password === item.password,
  );
  return credential?.role ?? null;
}
