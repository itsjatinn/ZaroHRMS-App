import { Link } from 'expo-router';
import { Check, Eye, EyeOff, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { isDemoLogin } from '../../src/auth/demoCredentials';
import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthShell from '../../src/components/auth/AuthShell';
import { Reveal, StaggerItem } from '../../src/components/auth/CardEntrance';
import { font } from '../../src/components/auth/fonts';
import { isValidEmail } from '../../src/components/auth/validate';

type Errors = { email?: string; password?: string };
type Step = 'email' | 'password';

export default function SignInScreen() {
  const { signIn, orgSlug, rememberedEmail } = useAuth();
  // The organization slug is remembered silently (no field). Falls back to the
  // default so the demo login keeps working.
  const organization = orgSlug ?? 'zaro';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(rememberedEmail ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Step 1 → 2: validate the email, then reveal the password block.
  const handleContinue = () => {
    setFormError(undefined);
    if (!email.trim()) {
      setErrors({ email: 'Email is required.' });
      return;
    }
    if (!isValidEmail(email)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    setErrors({});
    setStep('password');
  };

  // Back to editing the email.
  const editEmail = () => {
    setStep('email');
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

    // TODO: replace this demo check with a real API call and pass the token.
    // Setting the session flips the root guard and reveals the app.
    setLoading(true);
    try {
      if (!isDemoLogin(organization, email, password)) {
        setFormError('Incorrect email or password.');
        return;
      }
      // Remember me controls whether we persist the email for next launch; the
      // org slug is always kept so the workspace resolves.
      await signIn(undefined, {
        orgSlug: organization,
        email: rememberMe ? email : null,
      });
    } finally {
      setLoading(false);
    }
  };

  const onPassword = step === 'password';

  return (
    <AuthShell
      title="Sign in"
      subtitle="Sign in with your work email to continue."
    >
      <View className="gap-4">
        {formError ? (
          <View className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3">
            <Text className="text-sm text-rose-600">{formError}</Text>
          </View>
        ) : null}

        {/* Email — always visible. On the password step it settles into a
            read-only summary row with an edit affordance. */}
        <StaggerItem>
          {onPassword ? (
            <View className="h-16 flex-row items-center justify-between rounded-2xl border-[1.5px] border-slate-300 bg-white px-4">
              {/* Notched label, matching AuthField */}
              <View className="absolute -top-2.5 left-3 bg-white px-1.5" pointerEvents="none">
                <Text className="text-sm text-slate-500" style={{ fontFamily: font.semibold }}>
                  E-mail
                </Text>
              </View>
              <Text className="flex-1 text-base text-ink" numberOfLines={1}>
                {email}
              </Text>
              <Pressable
                onPress={editEmail}
                hitSlop={8}
                className="ml-3 flex-row items-center gap-1"
                accessibilityRole="button"
                accessibilityLabel="Edit email"
              >
                <Pencil size={15} color="#14323F" />
                <Text className="text-sm text-ink" style={{ fontFamily: font.semibold }}>
                  Edit
                </Text>
              </Pressable>
            </View>
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
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              editable={!loading}
              error={errors.email}
              onSubmitEditing={handleContinue}
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
              className="flex-row items-center gap-2"
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
              <Text className="text-sm text-slate-600" style={{ fontFamily: font.medium }}>
                Remember me
              </Text>
            </Pressable>

            <Link href="/forgot-password" asChild>
              <Pressable hitSlop={8}>
                <Text className="text-sm text-ink" style={{ fontFamily: font.semibold }}>
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
                  : 'Continue'
              }
              onPress={onPassword ? handleSignIn : handleContinue}
              loading={loading}
              disabled={onPassword ? password.length === 0 : email.trim().length === 0}
            />
          </View>
        </StaggerItem>
      </View>
    </AuthShell>
  );
}
