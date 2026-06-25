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

// Key under which the session token is persisted in the device keychain.
const SESSION_KEY = 'zaro.session';

type AuthContextValue = {
  /** The stored session token, or null when signed out. */
  session: string | null;
  /** True while the persisted session is being read on app start. */
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore any saved session once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(SESSION_KEY);
        if (active) setSession(saved);
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

  const signIn = useCallback(async (token = 'demo-session') => {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, token);
    } catch {
      // Ignore persistence failures; keep the in-memory session.
    }
    setSession(token);
  }, []);

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
      isLoading,
      isAuthenticated: session != null,
      signIn,
      signOut,
    }),
    [session, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Access the auth state/actions. Must be used within <AuthProvider>.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
