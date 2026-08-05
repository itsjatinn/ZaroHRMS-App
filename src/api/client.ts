import { API_URL } from './config';
import { getItem, removeItem, setItem } from '../auth/secureStorage';

// Single HTTP entry point for the app: attaches the bearer token, parses Nest's
// error envelope, and silently refreshes an expired access token once before
// giving up. Mirrors the web panel's src/utils/api.ts contract.

/** Access token in the device keychain — restored on launch. */
const ACCESS_TOKEN_KEY = 'zaro.accessToken';

/**
 * Tenant slug of the signed-in session. Kept here, beside the token, because
 * POST /auth/refresh requires it in the body — see refreshAccessToken. Reading
 * it from AuthContext instead would be circular: AuthContext imports this file.
 */
const TENANT_SLUG_KEY = 'zaro.tenantSlug';

/** Requests that hang longer than this are aborted (ms). */
const REQUEST_TIMEOUT = 20_000;

export class ApiError extends Error {
  readonly status: number;
  /** Nest's `error` field, e.g. "Unauthorized". */
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Thrown when the backend could not be reached at all (offline, wrong host). */
export class NetworkError extends Error {
  constructor(message = 'Cannot reach the server.') {
    super(message);
    this.name = 'NetworkError';
  }
}

let accessToken: string | null = null;
let tenantSlug: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function getAccessToken() {
  return accessToken;
}

/** Reads the persisted token into memory. Call once on app start. */
export async function restoreAccessToken() {
  try {
    accessToken = await getItem(ACCESS_TOKEN_KEY);
  } catch {
    // Storage unavailable — keep the in-memory client unauthenticated.
    accessToken = null;
  }
  return accessToken;
}

/**
 * Restores the session's tenant slug. Must run on app start alongside
 * restoreAccessToken, or the first refresh after a relaunch has no slug to
 * send and the session ends at the access token's expiry.
 */
export async function restoreTenantSlug() {
  try {
    tenantSlug = await getItem(TENANT_SLUG_KEY);
  } catch {
    tenantSlug = null;
  }
  return tenantSlug;
}

export async function setTenantSlug(slug: string | null) {
  tenantSlug = slug;
  try {
    if (slug) await setItem(TENANT_SLUG_KEY, slug);
    else await removeItem(TENANT_SLUG_KEY);
  } catch {
    // Ignore persistence failures; the in-memory value still works.
  }
}

export async function setAccessToken(token: string | null) {
  accessToken = token;
  try {
    if (token) await setItem(ACCESS_TOKEN_KEY, token);
    else await removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Ignore persistence failures; the in-memory token still works.
  }
}

/** Called when the session is gone for good, so AuthContext can sign out. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the Authorization header + refresh dance (login, forgot password). */
  anonymous?: boolean;
  /**
   * Treat a 401 as final: no refresh, no `onUnauthorized`. Used by logout,
   * where a rejected token is already the desired end state — otherwise its own
   * 401 calls back into signOut, which calls logout again, and so on.
   */
  noAuthRetry?: boolean;
};

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | { message?: string | string[]; error?: string }
    | null;
  const raw = body?.message;
  const message = Array.isArray(raw) ? raw[0] : raw;
  return new ApiError(
    response.status,
    message || body?.error || `Request failed (${response.status}).`,
    body?.error,
  );
}

// The refresh token is an HttpOnly cookie the backend set at login (path
// /api/auth); React Native's native cookie jar replays it for us. One refresh
// runs at a time so a burst of 401s doesn't rotate the token repeatedly.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Without a slug the request is a guaranteed 400, so don't spend a round
  // trip (and the caller's 20s timeout) to be told so.
  if (!tenantSlug) return null;
  refreshInFlight ??= (async () => {
    // Own timeout rather than the caller's signal: this promise is shared, so
    // one caller aborting must not cancel the refresh for everyone else. Without
    // a timeout an unreachable host stalls the refresh — and its caller — for as
    // long as the OS keeps the socket open.
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT);
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // tenantSlug is a REQUIRED body field (backend RefreshDto), and the
        // controller also checks it against the cookie's tenant. Posting `{}`
        // here was rejected by the validation pipe with a 400 before the
        // cookie was even read, so every silent refresh failed and the session
        // ended at the access token's TTL no matter how active the employee
        // was — which is exactly what "logged out automatically" looked like.
        body: JSON.stringify({ tenantSlug }),
        signal: timeout.signal,
        // The refresh token is an HttpOnly cookie on the API origin. Native
        // replays it from the cookie jar regardless, but a browser drops it on
        // a cross-origin request unless credentials are explicitly included —
        // without this the web build silently loses every session at the
        // 15-minute access-token expiry.
        credentials: 'include',
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { accessToken?: string };
      if (!body.accessToken) return null;
      await setAccessToken(body.accessToken);
      return body.accessToken;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      // Cleared on the next tick so concurrent callers share this result.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();
  return refreshInFlight;
}

function buildInit(options: RequestOptions, token: string | null): RequestInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return {
    method: options.method ?? 'GET',
    headers,
    // Applies to the login request too (anonymous), which is what lets the
    // browser *store* the HttpOnly refresh cookie the backend sets — without
    // it there is nothing for refreshAccessToken to replay later.
    credentials: 'include',
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  };
}

/** Issues a request against the backend and returns the parsed JSON body. */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${API_URL}${path}`;
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT);
  // Caller aborts (react-query cancellation) have to cancel the fetch too.
  const abortFromCaller = () => timeout.abort();
  options.signal?.addEventListener('abort', abortFromCaller);

  try {
    const token = options.anonymous ? null : accessToken;
    let response: Response;
    try {
      response = await fetch(url, {
        ...buildInit(options, token),
        signal: timeout.signal,
      });
    } catch (error) {
      // A caller-driven abort is not a connectivity problem — let it through.
      if (options.signal?.aborted) throw error;
      throw new NetworkError(
        `Cannot reach the server at ${url.replace(path, '')}.`,
      );
    }

    if (response.status === 401 && !options.anonymous && !options.noAuthRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        response = await fetch(url, {
          ...buildInit(options, refreshed),
          signal: timeout.signal,
        });
      } else {
        await setAccessToken(null);
        onUnauthorized?.();
      }
    }

    if (!response.ok) throw await readError(response);
    if (response.status === 204) return null as T;

    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiRequest<T>(path, { ...options, method: 'POST', body: body ?? {} }),
  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiRequest<T>(path, { ...options, method: 'PUT', body: body ?? {} }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiRequest<T>(path, { ...options, method: 'PATCH', body: body ?? {} }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
