import type { UserRole } from '../auth/demoCredentials';
import { api, ApiError } from './client';

// Auth endpoints of the HRMS backend (backend/src/auth/auth.controller.ts).

export type AuthUser = { id: string; name: string; email: string };
export type AuthTenant = { id: string; name: string; slug: string };

/** Membership role as stored by the backend. */
export type BackendRole =
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'HR_ADMIN'
  | 'SUPER_ADMIN'
  | (string & {});

type LoginSuccess = {
  user: AuthUser;
  tenant: AuthTenant;
  role: BackendRole;
  passwordResetRequired?: boolean;
  accessToken: string;
};

/** Returned instead of tokens when the account/org has MFA switched on. */
type MfaChallenge = { mfaRequired: true; challengeToken: string };

type LoginResponse = LoginSuccess | MfaChallenge;

export type LoginInput = {
  tenantSlug: string;
  email: string;
  password: string;
};

/** The app only distinguishes employee vs manager surfaces. */
export function toAppRole(role: BackendRole): UserRole {
  return role === 'MANAGER' ? 'manager' : 'employee';
}

export async function login(input: LoginInput): Promise<LoginSuccess> {
  const result = await api.post<LoginResponse>(
    '/auth/login',
    {
      tenantSlug: input.tenantSlug.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    },
    { anonymous: true },
  );

  // Neither flow can be completed from the app yet, so both stop here with a
  // message instead of leaving the user on a spinner.
  if ('mfaRequired' in result) {
    throw new ApiError(
      401,
      'Two-factor authentication is on for this account. Sign in on the web portal.',
    );
  }
  if (result.passwordResetRequired) {
    throw new ApiError(
      401,
      'Your password must be changed before signing in. Please update it on the web portal.',
    );
  }

  return result;
}

/** Current user + tenant for an existing token (used to validate a session). */
export function fetchMe() {
  return api.get<{
    user?: AuthUser;
    tenant?: AuthTenant;
    role?: BackendRole;
  }>('/auth/me');
}

/** Best-effort server-side sign-out — clears the refresh token/cookie. */
export function logout() {
  // `noAuthRetry`: an expired token here needs no refresh — we are throwing the
  // session away anyway, and letting the 401 reach `onUnauthorized` would
  // re-enter signOut and call this again in a loop.
  return api.post('/auth/logout', {}, { noAuthRetry: true });
}
