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

// Keys under which auth state is persisted in the device keychain.
const SESSION_KEY = 'zaro.session';
// The last organization slug the employee signed in with. Kept across sign-out
// so the workspace resolves and they never re-type it.
const ORG_SLUG_KEY = 'zaro.orgSlug';
// The last email, kept only when "Remember me" is on, to prefill next launch.
const EMAIL_KEY = 'zaro.email';

type SignInOptions = {
  /** Persisted so next launch can resolve the workspace without a field. */
  orgSlug?: string;
  /**
   * The email to remember for next launch, or null to forget it (Remember me
   * unchecked). Omit to leave any stored email untouched.
   */
  email?: string | null;
};

type AuthContextValue = {
  /** The stored session token, or null when signed out. */
  session: string | null;
  /** Last org slug used to sign in, remembered across sign-out (null if never). */
  orgSlug: string | null;
  /** Last email, remembered only when "Remember me" was on (null otherwise). */
  rememberedEmail: string | null;
  /** True while the persisted session is being read on app start. */
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token?: string, options?: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore any saved session + remembered org slug + email once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedSession, savedSlug, savedEmail] = await Promise.all([
          SecureStore.getItemAsync(SESSION_KEY),
          SecureStore.getItemAsync(ORG_SLUG_KEY),
          SecureStore.getItemAsync(EMAIL_KEY),
        ]);
        if (active) {
          setSession(savedSession);
          setOrgSlug(savedSlug);
          setRememberedEmail(savedEmail);
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
    async (token = 'demo-session', options?: SignInOptions) => {
      const slug = options?.orgSlug?.trim();
      const email = options?.email?.trim();
      try {
        await SecureStore.setItemAsync(SESSION_KEY, token);
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
      setSession(token);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      // Ignore; clear in-memory session regardless.
    }
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      orgSlug,
      rememberedEmail,
      isLoading,
      isAuthenticated: session != null,
      signIn,
      signOut,
    }),
    [session, orgSlug, rememberedEmail, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Access the auth state/actions. Must be used within <AuthProvider>.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
