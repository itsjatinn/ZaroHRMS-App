import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { requestPasswordReset } from '../../src/api/auth';
import { NetworkError } from '../../src/api/client';
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
  const [sent, setSent] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      await requestPasswordReset(email);
      // The response is deliberately identical whether or not the address is
      // registered, so this screen cannot say "we sent it" — only that we
      // would have. Saying more would turn the screen into an oracle for
      // which emails hold an account.
      setSent(true);
    } catch (err) {
      // A failed send is worth surfacing: the backend deliberately throws
      // rather than returning success when the mail relay is down, because
      // the old behaviour left people waiting for an email that never came.
      setError(
        err instanceof NetworkError
          ? 'Cannot reach the server. Check your connection and try again.'
          : err instanceof Error && err.message
            ? err.message
            : 'Could not send the reset link. Please try again in a moment.',
      );
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
      title={sent ? 'Check your email' : 'Forgot password'}
      subtitle={
        sent
          ? `If an account exists for ${email.trim()}, a reset link is on its way. The link opens in your browser and expires in 1 hour.`
          : "Enter your email and we'll send you a link to reset it."
      }
      visualSource={require('../../assets/forgot_pass.png')}
    >
      {sent ? (
        <View className="gap-4">
          <Text
            className="text-center text-sm text-slate-500"
            style={{ fontFamily: font.regular }}
          >
            Nothing arrived? Check your spam folder. You can request another
            link in 15 minutes.
          </Text>
          <AuthButton label="Back to sign in" onPress={backToSignIn} />
        </View>
      ) : (
      <View className="gap-4">
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
      )}
    </AuthShell>
  );
}
