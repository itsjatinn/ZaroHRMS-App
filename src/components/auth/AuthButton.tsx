import { ActivityIndicator, Pressable, Text } from 'react-native';

import { font } from './fonts';

type AuthButtonProps = {
  label: string;
  onPress?: () => void;
  /** Shows a spinner and blocks presses while an action is in flight. */
  loading?: boolean;
  /** Greys out and blocks presses (e.g. form incomplete). */
  disabled?: boolean;
};

// Primary action button used at the bottom of each auth form. Matches the
// app's yellow CTA (yellow fill, dark navy label, e.g. "Download PDF").
export default function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: AuthButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      // Keep the pseudo-class (active:) + transform style static. Toggling it
      // with state makes NativeWind try to "upgrade" the component, which crashes
      // in dev (css-interop stringifies props and hits a throwing getter).
      className={`h-14 flex-row items-center justify-center gap-2 rounded-xl bg-[#F5D14E] active:scale-[0.98] ${
        inactive ? 'opacity-50' : ''
      }`}
    >
      {loading ? <ActivityIndicator color="#14323F" /> : null}
      <Text
        className="text-base text-[#14323F]"
        style={{ fontFamily: font.bold }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
