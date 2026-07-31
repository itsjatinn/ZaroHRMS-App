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

/**
 * The app only distinguishes employee vs manager surfaces. This covers only
 * the explicit account roles — most managers hold a plain EMPLOYEE role and
 * are managers by reporting lines, which useIsManager() resolves from
 * GET /employees/me/is-manager after sign-in (the same split the web makes).
 */
export function toAppRole(role: BackendRole): UserRole {
  return role === 'MANAGER' || role === 'REPORTING_MANAGER'
    ? 'manager'
    : 'employee';
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

export type TenantBrand = {
  name: string;
  slug: string;
  logo: string | null;
};

/** Wire shape: the backend nests the tenant under `tenant` and adds a palette. */
type TenantBrandResponse = {
  tenant?: { name?: string; slug?: string; logo?: string | null };
};

/**
 * Resolves an organization slug to its display name. Public endpoint (no bearer
 * token), so it can run before sign-in — which lets the org be confirmed on
 * the first step instead of failing later as an indistinguishable
 * "Invalid credentials" from /auth/login.
 *
 * Throws ApiError(401) when no tenant has that slug. Always resolves to fully
 * populated fields, so callers can never write an undefined back into state.
 */
export async function getTenantBrand(slug: string): Promise<TenantBrand> {
  const normalized = slug.trim().toLowerCase();
  const result = await api.get<TenantBrandResponse>(
    `/auth/tenant-brand/${encodeURIComponent(normalized)}`,
    { anonymous: true },
  );
  const tenant = result?.tenant;
  return {
    // Fall back to what was asked for rather than propagating undefined — an
    // unexpected payload should not be able to blank the field the user typed.
    name: tenant?.name?.trim() || normalized,
    slug: tenant?.slug?.trim() || normalized,
    logo: tenant?.logo ?? null,
  };
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
