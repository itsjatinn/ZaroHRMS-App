import { ActivityIndicator, Pressable, Text } from 'react-native';

import { font } from './fonts';

type AuthButtonProps = {
  label: string;
  onPress?: () => void;
  /** Shows a spinner and blocks presses while an action is in flight. */
  loading?: boolean;
  /** Greys out and blocks presses (e.g. form incomplete). */
  disabled?: boolean;
  /** "primary" = ink fill (default). "gold" = gold fill for a softer CTA. */
  variant?: 'primary' | 'gold';
};

// Primary action button at the bottom of each auth form. Defaults to the app's
// ink (#14323F) primary with light text, matching the in-app CTAs.
export default function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: AuthButtonProps) {
  const inactive = disabled || loading;
  const isGold = variant === 'gold';
  const fill = isGold ? 'bg-gold' : 'bg-[#14323F]';
  const labelColor = isGold ? 'text-[#14323F]' : 'text-white';
  const spinnerColor = isGold ? '#14323F' : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      // Keep the pseudo-class (active:) + transform style static. Toggling it
      // with state makes NativeWind try to "upgrade" the component, which crashes
      // in dev (css-interop stringifies props and hits a throwing getter).
      className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${fill} active:scale-[0.98] ${
        inactive ? 'opacity-50' : ''
      }`}
    >
      {loading ? <ActivityIndicator color={spinnerColor} /> : null}
      <Text className={`text-base ${labelColor}`} style={{ fontFamily: font.bold }}>
        {label}
      </Text>
    </Pressable>
  );
}
