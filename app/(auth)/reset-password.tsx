import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { resetPassword } from '../../src/api/auth';
import { Alert } from '../../src/components/CrossAlert';
import { NetworkError } from '../../src/api/client';
import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthShell from '../../src/components/auth/AuthShell';
import { font } from '../../src/components/auth/fonts';
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '../../src/components/auth/validate';

type Errors = { password?: string; confirm?: string; form?: string };

export default function ResetPasswordScreen() {
  const router = useRouter();
  // Carried on the link from the reset email, e.g.
  // zarohrm://reset-password?token=… — the token *is* the credential, so
  // there is nothing else to authenticate this screen with.
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const resetToken = (token ?? '').trim();
  const canSubmit =
    resetToken.length > 0 && password.length > 0 && confirm.length > 0;

  const validate = (): Errors => {
    const next: Errors = {};
    // Checked against the server's own rule, not just a length, so the
    // requirements appear before the request rather than as a 400 after it.
    if (!isStrongPassword(password)) next.password = STRONG_PASSWORD_MESSAGE;
    if (!confirm) next.confirm = 'Please confirm your password.';
    else if (password !== confirm) next.confirm = 'Passwords do not match.';
    return next;
  };

  const goToSignIn = () => router.replace('/sign-in');

  const handleSetPassword = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ token: resetToken, newPassword: password });
      // The token is spent and the old password is gone, so there is no way
      // back to this screen — send them to sign in with the new one.
      const done = 'Your password has been changed. Please sign in.';
      if (Platform.OS === 'web') {
        goToSignIn();
      } else {
        Alert.alert('Password updated', done, [
          { text: 'Sign in', onPress: goToSignIn },
        ]);
      }
    } catch (err) {
      // An expired, spent or unknown token is the common failure here, and it
      // is not fixable on this screen — the message has to send them back to
      // request a fresh link rather than leave them retrying a dead token.
      setErrors({
        form:
          err instanceof NetworkError
            ? 'Cannot reach the server. Check your connection and try again.'
            : err instanceof Error && err.message
              ? err.message
              : 'Could not update your password. Request a new reset link and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reached without a token — deep-linked wrongly, or opened directly. There
  // is no way to recover in place, so say so instead of showing a form whose
  // submit can only ever fail.
  if (!resetToken) {
    return (
      <AuthShell
        title="Link not valid"
        subtitle="Open the reset link from your email to set a new password. Links expire 1 hour after they are sent."
        visualSource={require('../../assets/reset_pass.png')}
      >
        <View className="gap-4">
          <AuthButton
            label="Request a new link"
            onPress={() => router.replace('/forgot-password')}
          />
          <Pressable hitSlop={8} className="mt-2 self-center" onPress={goToSignIn}>
            <Text
              className="text-base text-ink"
              style={{ fontFamily: font.semibold }}
            >
              Back to login
            </Text>
          </Pressable>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter a new password for your account. The link expires in 1 hour."
      visualSource={require('../../assets/reset_pass.png')}
    >
      <View className="gap-4">
        <AuthField
          label="New password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errors.password)
              setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="8+ chars, upper, lower, number, symbol"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!loading}
          error={errors.password}
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

        <AuthField
          label="Confirm password"
          value={confirm}
          onChangeText={(t) => {
            setConfirm(t);
            if (errors.confirm)
              setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          placeholder="Re-enter your password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!loading}
          error={errors.confirm}
        />

        {errors.form ? (
          <Text
            className="text-center text-sm text-rose-500"
            style={{ fontFamily: font.regular }}
          >
            {errors.form}
          </Text>
        ) : null}

        <View className="mt-2">
          <AuthButton
            label={loading ? 'Saving…' : 'Set new password'}
            onPress={handleSetPassword}
            loading={loading}
            disabled={!canSubmit}
          />
        </View>

        <Pressable
          hitSlop={8}
          className="mt-2 self-center"
          onPress={() => router.replace('/sign-in')}
        >
          <Text
            className="text-base text-ink"
            style={{ fontFamily: font.semibold }}
          >
            Back to login
          </Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
