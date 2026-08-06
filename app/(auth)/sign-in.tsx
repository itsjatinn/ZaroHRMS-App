import Constants from 'expo-constants';
import { Link, useLocalSearchParams } from 'expo-router';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getTenantBrand, login, toAppRole } from '../../src/api/auth';
import { ApiError, NetworkError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import {
  authenticateDemoLogin,
  isDemoOrganization,
} from '../../src/auth/demoCredentials';
import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthForm from '../../src/components/auth/AuthForm';
import AuthShell from '../../src/components/auth/AuthShell';
import { Reveal, StaggerItem } from '../../src/components/auth/CardEntrance';
import { font } from '../../src/components/auth/fonts';
import {
  isValidEmail,
  isValidOrgSlug,
  normalizeOrgSlug,
} from '../../src/components/auth/validate';

type Errors = { org?: string; email?: string; password?: string };
type Step = 'email' | 'password';

export default function SignInScreen() {
  const { signIn, orgSlug, rememberedEmail, isLoading } = useAuth();

  /**
   * `?org=<slug>` carries the tenant across the panel's mobile redirect. The
   * panel resolves the tenant from the subdomain (acme.hrms.zarohr.com), but
   * the mobile build is served from a single host and cannot, so the slug has
   * to ride along in the URL or the user lands on a form asking for an
   * organization they may not know by name.
   *
   * The param wins over the remembered slug: it says where this user just came
   * from, which beats whatever the device saw last.
   */
  const params = useLocalSearchParams<{ org?: string | string[] }>();
  const orgParam = Array.isArray(params.org) ? params.org[0] : params.org;
  const initialOrg = normalizeOrgSlug(orgParam ?? '') || orgSlug || '';

  /**
   * The backend requires a tenant slug on every login and returns a generic
   * "Invalid credentials" when it doesn't resolve, so the org has to be a real
   * field. Once a device has signed in successfully the slug is remembered and
   * the field collapses into a tappable summary row — the same shape the web
   * login takes when it can derive the slug from the subdomain.
   */
  const [org, setOrg] = useState(initialOrg);
  const [editingOrg, setEditingOrg] = useState(initialOrg === '');
  /** Organization name confirmed by the server, shown instead of the raw slug. */
  const [orgName, setOrgName] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(rememberedEmail ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  /**
   * AuthContext reads the remembered org + email out of the keychain
   * asynchronously, and this screen mounts before that finishes — RootNavigator
   * renders the (auth) stack while `isLoading` is still true (it only gates the
   * splash). So the useState initialisers above always saw null, and "Remember
   * me" persisted the email but nothing ever put it back in the field.
   *
   * Fill them in once the restore lands, guarded so a value the user has
   * already typed is never overwritten, and only once per mount.
   */
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (isLoading || hydratedRef.current) return;
    hydratedRef.current = true;
    if (rememberedEmail && !email) setEmail(rememberedEmail);
    // `?org=` still wins: it says where this user just came from.
    if (!orgParam && orgSlug && !org) {
      setOrg(orgSlug);
      // Collapse to the tappable summary row, as it does after a manual entry.
      setEditingOrg(false);
    }
    // `email` / `org` are read, not tracked: this runs once (hydratedRef) and
    // must see what is typed at that moment, not re-fire when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, rememberedEmail, orgSlug, orgParam]);

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [checkingOrg, setCheckingOrg] = useState(false);

  // Step 1 → 2: validate the org + email, confirm the org exists, then reveal
  // the password block.
  const handleContinue = async () => {
    setFormError(undefined);

    const slug = normalizeOrgSlug(org);
    if (!slug) {
      setErrors({ org: 'Organization is required.' });
      return;
    }
    if (!isValidOrgSlug(slug)) {
      setErrors({ org: 'Use lowercase letters, numbers and hyphens.' });
      return;
    }
    if (!email.trim()) {
      setErrors({ email: 'Email is required.' });
      return;
    }
    if (!isValidEmail(email)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    setErrors({});

    // Resolve the slug before asking for a password, so a wrong organization is
    // reported as exactly that rather than surfacing later as a password error.
    //
    // This lookup is advisory and must never be the only thing standing between
    // the user and a sign-in attempt: only a definite 401 ("Tenant not found")
    // blocks. An unreachable server, an unexpected status, or the demo
    // workspace all fall through and let /auth/login decide — otherwise a
    // flaky endpoint or the demo org, which usually isn't in the database,
    // would lock the user out of a login that would have succeeded.
    setCheckingOrg(true);
    try {
      const brand = await getTenantBrand(slug);
      setOrgName(brand.name);
      // Guarded: writing an undefined here would blank the field the user just
      // filled in and crash the next render that trims it.
      if (brand.slug) setOrg(brand.slug);
    } catch (error) {
      const notFound = error instanceof ApiError && error.status === 401;
      // The demo-org bypass only matters where the demo login itself works.
      if (notFound && !(__DEV__ && isDemoOrganization(slug))) {
        // Open the field alongside the error — a returning user arrives here
        // with the collapsed summary row, which has nowhere to show it.
        setEditingOrg(true);
        setOrgName(null);
        setErrors({ org: `No organization found with the ID “${slug}”.` });
        return;
      }
      setOrgName(null);
    } finally {
      setCheckingOrg(false);
    }

    setEditingOrg(false);
    setStep('password');
  };

  // Back to editing the email (and the organization, if they need it).
  const editEmail = () => {
    setStep('email');
    setPassword('');
    setErrors({});
    setFormError(undefined);
  };

  const editOrg = () => {
    setStep('email');
    setEditingOrg(true);
    setOrgName(null);
    setPassword('');
    setErrors({});
    setFormError(undefined);
  };

  const handleSignIn = async () => {
    setFormError(undefined);
    if (!password) {
      setErrors({ password: 'Password is required.' });
      return;
    }
    setErrors({});

    // Signs in against the HRMS backend. Setting the session flips the root
    // guard and reveals the app.
    const organization = normalizeOrgSlug(org);
    setLoading(true);
    try {
      const result = await login({
        tenantSlug: organization,
        email,
        password,
      });
      // Remember me controls whether we persist the email for next launch; the
      // org slug is always kept so the workspace resolves.
      await signIn(result.accessToken, {
        orgSlug: organization,
        email: rememberMe ? email : null,
        role: toAppRole(result.role),
        user: result.user,
        tenant: result.tenant,
      });
    } catch (error) {
      // Demo escape hatch, DEV BUILDS ONLY: when the backend can't sign this
      // user in, the hardcoded demo credentials still open the app with mock
      // data so local development stays demoable. Gated on __DEV__ so a
      // shipped build can never be opened with the well-known demo password —
      // ungated, these credentials were a working backdoor in production.
      const demoRole = __DEV__
        ? authenticateDemoLogin(organization, email, password)
        : null;
      if (demoRole) {
        await signIn(undefined, {
          orgSlug: organization,
          email: rememberMe ? email : null,
          role: demoRole,
        });
        return;
      }

      if (error instanceof ApiError) {
        // The org was resolved on the previous step, so a 401 here is about the
        // email/password pair — not the workspace.
        setFormError(
          error.status === 401
            ? orgName
              ? `That email and password don't match an account at ${orgName}.`
              : error.message || 'Incorrect email or password.'
            : error.message,
        );
        return;
      }
      setFormError(
        error instanceof NetworkError
          ? 'Cannot reach the server. Check your connection and try again.'
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const onPassword = step === 'password';

  /**
   * Whatever the current step's primary action is. Routed through <AuthForm>
   * rather than called directly from the button so that on web it travels as a
   * real form submission — the event browsers watch for before offering to save
   * the credentials.
   */
  const submitStep = () => {
    if (onPassword) void handleSignIn();
    else void handleContinue();
  };
  const submitHandle = useRef<(() => void) | null>(null);

  return (
    <AuthShell
      title="Sign in"
      subtitle="Sign in with your work email to continue."
    >
      <View className="gap-4">
        <AuthForm
          onSubmit={submitStep}
          submitHandle={submitHandle}
          // Only on the password step, where the visible email field is gone.
          hiddenUsername={onPassword ? email : undefined}
        >
        {formError ? (
          <View className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3">
            <Text className="text-sm text-rose-600">{formError}</Text>
          </View>
        ) : null}

        {/* Organization — a real field until a slug has been confirmed, then a
            compact summary row so returning users never retype it. */}
        <StaggerItem>
          {editingOrg ? (
            <View>
              <AuthField
              label="Organization ID"
              value={org}
              onChangeText={(t) => {
                setOrg(t);
                if (errors.org) setErrors((e) => ({ ...e, org: undefined }));
              }}
              placeholder="your-company"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="organization"
              spellCheck={false}
              autoFocus={orgSlug == null}
              editable={!loading && !checkingOrg}
              error={errors.org}
              returnKeyType="next"
              />
            </View>
          ) : (
            <Pressable
              onPress={editOrg}
              className="h-14 flex-row items-center rounded-2xl border-[1.5px] border-slate-300 bg-white px-4"
              accessibilityRole="button"
              accessibilityLabel="Change organization"
            >
              <View className="absolute -top-2.5 left-3 px-1.5" pointerEvents="none">
                <View className="absolute inset-0 overflow-hidden rounded-[4px]">
                  <View className="h-1/2 w-full bg-canvas" />
                  <View className="h-1/2 w-full bg-white" />
                </View>
                <Text
                  className="text-sm text-slate-500"
                  style={{ fontFamily: font.semibold, lineHeight: 18 }}
                >
                  Organization
                </Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="text-base text-ink"
                  numberOfLines={1}
                  style={{ fontFamily: font.regular }}
                >
                  {orgName ?? normalizeOrgSlug(org)}
                </Text>
              </View>
            </Pressable>
          )}
        </StaggerItem>

        {/* Email — always visible. On the password step it settles into a
            read-only summary field that can be tapped to edit. */}
        <StaggerItem>
          {onPassword ? (
            <Pressable
              onPress={editEmail}
              className="h-14 flex-row items-center rounded-2xl border-[1.5px] border-slate-300 bg-white px-4"
              accessibilityRole="button"
              accessibilityLabel="Edit email"
            >
              <View className="absolute -top-2.5 left-3 px-1.5" pointerEvents="none">
                <View className="absolute inset-0 overflow-hidden rounded-[4px]">
                  <View className="h-1/2 w-full bg-canvas" />
                  <View className="h-1/2 w-full bg-white" />
                </View>
                <Text
                  className="text-sm text-slate-500"
                  style={{ fontFamily: font.semibold, lineHeight: 18 }}
                >
                  E-mail
                </Text>
              </View>
              <Text
                className="min-w-0 flex-1 text-base text-ink"
                numberOfLines={1}
                style={{ fontFamily: font.regular }}
              >
                {email}
              </Text>
            </Pressable>
          ) : (
            <AuthField
              label="E-mail"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="example@email.com"
              keyboardType="email-address"
              // "username" rather than "email": it is the token password
              // managers pair with current-password to store one credential.
              autoComplete="username"
              textContentType="username"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={!editingOrg}
              editable={!loading && !checkingOrg}
              error={errors.email}
              onSubmitEditing={() => void handleContinue()}
              returnKeyType="next"
            />
          )}
        </StaggerItem>

        {/* Password — slides in on the second step. */}
        <Reveal show={onPassword}>
          <View className="gap-4">
            <AuthField
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password)
                  setErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              autoCapitalize="none"
              autoFocus
              editable={!loading}
              error={errors.password}
              onSubmitEditing={handleSignIn}
              returnKeyType="go"
              rightSlot={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#48626E" />
                  ) : (
                    <Eye size={20} color="#48626E" />
                  )}
                </Pressable>
              }
            />
          </View>
        </Reveal>

        {/* Remember me + Forgot password — always visible */}
        <StaggerItem>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => setRememberMe((v) => !v)}
              hitSlop={8}
              className="min-w-0 flex-shrink flex-row items-center gap-2"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded-md border ${
                  rememberMe ? 'border-ink bg-ink' : 'border-slate-300 bg-white'
                }`}
              >
                {rememberMe ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <Text
                className="min-w-0 flex-shrink text-sm text-slate-600"
                numberOfLines={1}
                style={{ fontFamily: font.medium, lineHeight: 20, paddingRight: 2 }}
              >
                Remember me
              </Text>
            </Pressable>

            <Link href="/forgot-password" asChild>
              <Pressable hitSlop={8} className="ml-3 shrink-0">
                <Text
                  className="text-sm text-ink"
                  numberOfLines={1}
                  style={{ fontFamily: font.semibold, lineHeight: 20, paddingHorizontal: 2 }}
                >
                  Forgot password?
                </Text>
              </Pressable>
            </Link>
          </View>
        </StaggerItem>

        {/* Primary action — Continue on step 1, Sign in on step 2 */}
        <StaggerItem>
          <View className="mt-2">
            <AuthButton
              label={
                onPassword
                  ? loading
                    ? 'Signing in…'
                    : 'Sign in'
                  : checkingOrg
                    ? 'Checking…'
                    : 'Continue'
              }
              onPress={() => (submitHandle.current ?? submitStep)()}
              loading={loading || checkingOrg}
              disabled={
                onPassword
                  ? password.length === 0
                  : !email?.trim() || !org?.trim()
              }
            />
          </View>
        </StaggerItem>

        {/* Build identity — which binary is actually installed. Settles any
            "is this the new build?" question without a computer. */}
        <StaggerItem>
          <Text className="mt-4 text-center text-[11px] text-slate-400">
            v{Constants.expoConfig?.version ?? '—'}
          </Text>
        </StaggerItem>
        </AuthForm>
      </View>
    </AuthShell>
  );
}
