import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { logout as logoutRequest, type AuthTenant, type AuthUser } from '../api/auth';
import {
  getAccessToken,
  restoreAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
} from '../api/client';
import { queryClient } from '../api/queryClient';
import type { UserRole } from './demoCredentials';

// Keys under which auth state is persisted in the device keychain. The access
// token itself lives in src/api/client.ts, which owns it for every request.
const SESSION_KEY = 'zaro.session';
// The last organization slug the employee signed in with. Kept across sign-out
// so the workspace resolves and they never re-type it.
const ORG_SLUG_KEY = 'zaro.orgSlug';
// The last email, kept only when "Remember me" is on, to prefill next launch.
const EMAIL_KEY = 'zaro.email';
const ROLE_KEY = 'zaro.role';
/** Signed-in user + tenant from the login response, for headers/profile. */
const PROFILE_KEY = 'zaro.profile';

type Profile = { user: AuthUser | null; tenant: AuthTenant | null };

const EMPTY_PROFILE: Profile = { user: null, tenant: null };

type SignInOptions = {
  /** Persisted so next launch can resolve the workspace without a field. */
  orgSlug?: string;
  /**
   * The email to remember for next launch, or null to forget it (Remember me
   * unchecked). Omit to leave any stored email untouched.
   */
  email?: string | null;
  role?: UserRole;
  /** Backend identity, absent for the offline demo session. */
  user?: AuthUser | null;
  tenant?: AuthTenant | null;
};

type AuthContextValue = {
  /** The stored session token, or null when signed out. */
  session: string | null;
  /** Last org slug used to sign in, remembered across sign-out (null if never). */
  orgSlug: string | null;
  /** Last email, remembered only when "Remember me" was on (null otherwise). */
  rememberedEmail: string | null;
  userRole: UserRole;
  /** Signed-in employee, when the session came from the backend. */
  user: AuthUser | null;
  tenant: AuthTenant | null;
  /** False for the offline demo session — screens fall back to mock data. */
  isBackendSession: boolean;
  /** True while the persisted session is being read on app start. */
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token?: string, options?: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
};

/** Marks a session that never hit the backend (demo credentials, offline). */
export const DEMO_SESSION_TOKEN = 'demo-session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Restore any saved session + remembered org slug + email once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedSession, savedSlug, savedEmail, savedRole, savedProfile] =
          await Promise.all([
            SecureStore.getItemAsync(SESSION_KEY),
            SecureStore.getItemAsync(ORG_SLUG_KEY),
            SecureStore.getItemAsync(EMAIL_KEY),
            SecureStore.getItemAsync(ROLE_KEY),
            SecureStore.getItemAsync(PROFILE_KEY),
          ]);
        // Hand the API client its bearer token before any screen renders.
        await restoreAccessToken();
        if (active) {
          setSession(savedSession);
          setOrgSlug(savedSlug);
          setRememberedEmail(savedEmail);
          setUserRole(savedRole === 'manager' ? 'manager' : 'employee');
          setProfile(
            savedProfile
              ? ((JSON.parse(savedProfile) as Profile) ?? EMPTY_PROFILE)
              : EMPTY_PROFILE,
          );
        }
      } catch {
        // Secure storage unavailable (e.g. web) -> treat as signed out.
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (token = DEMO_SESSION_TOKEN, options?: SignInOptions) => {
      const slug = options?.orgSlug?.trim();
      const email = options?.email?.trim();
      const role = options?.role ?? 'employee';
      const nextProfile: Profile = {
        user: options?.user ?? null,
        tenant: options?.tenant ?? null,
      };
      // A backend session's token is the bearer the API client sends; the demo
      // session deliberately leaves the client without one.
      await setAccessToken(token === DEMO_SESSION_TOKEN ? null : token);
      try {
        await SecureStore.setItemAsync(SESSION_KEY, token);
        await SecureStore.setItemAsync(ROLE_KEY, role);
        await SecureStore.setItemAsync(
          PROFILE_KEY,
          JSON.stringify(nextProfile),
        );
        // Remember the org so the workspace resolves next time.
        if (slug) await SecureStore.setItemAsync(ORG_SLUG_KEY, slug);
        // Remember or forget the email based on the "Remember me" choice.
        if (options?.email === null) {
          await SecureStore.deleteItemAsync(EMAIL_KEY);
        } else if (email) {
          await SecureStore.setItemAsync(EMAIL_KEY, email);
        }
      } catch {
        // Ignore persistence failures; keep the in-memory session.
      }
      if (slug) setOrgSlug(slug);
      if (options?.email === null) setRememberedEmail(null);
      else if (email) setRememberedEmail(email);
      setUserRole(role);
      setProfile(nextProfile);
      setSession(token);
    },
    [],
  );

  const signOut = useCallback(async () => {
    // Fire-and-forget: awaiting this made "Sign out" hang for the full
    // REQUEST_TIMEOUT (20s) whenever the backend was unreachable, which is
    // always true for the offline demo session. Signing out is a local
    // operation — telling the server is best effort and must never gate the UI.
    // The demo session holds no bearer token, so there is nothing to invalidate.
    // NOTE: dispatched before setAccessToken(null) because apiRequest reads the
    // token synchronously, so the request still carries the current bearer.
    if (getAccessToken()) void logoutRequest().catch(() => undefined);
    await setAccessToken(null);
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SESSION_KEY),
        SecureStore.deleteItemAsync(ROLE_KEY),
        SecureStore.deleteItemAsync(PROFILE_KEY),
      ]);
    } catch {
      // Ignore; clear in-memory session regardless.
    }
    queryClient.clear();
    setSession(null);
    setUserRole('employee');
    setProfile(EMPTY_PROFILE);
  }, []);

  // A refresh that can no longer be rescued drops the user on the sign-in card.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      orgSlug,
      rememberedEmail,
      userRole,
      user: profile.user,
      tenant: profile.tenant,
      isBackendSession: session != null && session !== DEMO_SESSION_TOKEN,
      isLoading,
      isAuthenticated: session != null,
      signIn,
      signOut,
    }),
    [session, orgSlug, rememberedEmail, userRole, profile, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Access the auth state/actions. Must be used within <AuthProvider>.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
