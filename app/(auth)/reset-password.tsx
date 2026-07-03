import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthShell from '../../src/components/auth/AuthShell';
import { font } from '../../src/components/auth/fonts';
import { MIN_PASSWORD_LENGTH } from '../../src/components/auth/validate';

type Errors = { password?: string; confirm?: string };

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const canSubmit = password.length > 0 && confirm.length > 0;

  const validate = (): Errors => {
    const next: Errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (!confirm) next.confirm = 'Please confirm your password.';
    else if (password !== confirm) next.confirm = 'Passwords do not match.';
    return next;
  };

  const handleSetPassword = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // TODO: submit the new password to the API. For now return to sign in.
    setLoading(true);
    try {
      router.replace('/sign-in');
    } finally {
      setLoading(false);
    }
  };

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
          placeholder="At least 8 characters"
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
