import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { isDemoLogin } from '../../src/auth/demoCredentials';
import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthShell from '../../src/components/auth/AuthShell';
import { font } from '../../src/components/auth/fonts';
import { isValidEmail } from '../../src/components/auth/validate';

type Errors = { organization?: string; email?: string; password?: string };

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [organization, setOrganization] = useState('zaro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  // The button only enables once every field is filled.
  const canSubmit =
    organization.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0;

  const validate = (): Errors => {
    const next: Errors = {};
    if (!organization.trim()) next.organization = 'Organization is required.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    return next;
  };

  const handleSignIn = async () => {
    setFormError(undefined);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // TODO: replace this demo check with a real API call and pass the token.
    // Setting the session flips the root guard and reveals the app.
    setLoading(true);
    try {
      if (!isDemoLogin(organization, email, password)) {
        setFormError('Invalid organization, email, or password.');
        return;
      }
      await signIn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your work email and password to continue."
    >
      <View className="gap-5">
        {formError ? (
          <View className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3">
            <Text className="text-sm text-rose-600">{formError}</Text>
          </View>
        ) : null}

        <AuthField
          label="Organization"
          variant="outlined"
          value={organization}
          onChangeText={(t) => {
            setOrganization(t);
            if (errors.organization)
              setErrors((e) => ({ ...e, organization: undefined }));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          error={errors.organization}
        />

        <AuthField
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          error={errors.email}
        />

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
          editable={!loading}
          error={errors.password}
          rightSlot={
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Text
                className="text-sm text-ink"
                style={{ fontFamily: font.semibold }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          }
        />

        <View className="mt-2">
          <AuthButton
            label={loading ? 'Signing in…' : 'Sign in'}
            onPress={handleSignIn}
            loading={loading}
            disabled={!canSubmit}
          />
        </View>

        <Link href="/forgot-password" asChild>
          <Pressable hitSlop={8} className="mt-2 self-center">
            <Text
              className="text-base text-ink"
              style={{ fontFamily: font.semibold }}
            >
              Forgot password?
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
