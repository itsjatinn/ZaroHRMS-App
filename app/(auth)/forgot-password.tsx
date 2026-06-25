import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthShell from '../../src/components/auth/AuthShell';
import { font } from '../../src/components/auth/fonts';
import { isValidEmail } from '../../src/components/auth/validate';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    // TODO: call the reset-link API. For now continue to the reset screen so
    // the flow is viewable end to end.
    setLoading(true);
    try {
      router.push('/reset-password');
    } finally {
      setLoading(false);
    }
  };

  const backToSignIn = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/sign-in');
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a link to reset it."
    >
      <View className="gap-5">
        <AuthField
          label="Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (error) setError(undefined);
          }}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          error={error}
        />

        <View className="mt-2">
          <AuthButton
            label={loading ? 'Sending…' : 'Send reset link'}
            onPress={handleSendLink}
            loading={loading}
            disabled={email.trim().length === 0}
          />
        </View>

        <Pressable hitSlop={8} className="mt-2 self-center" onPress={backToSignIn}>
          <Text
            className="text-base text-ink"
            style={{ fontFamily: font.semibold }}
          >
            Back to sign in
          </Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
