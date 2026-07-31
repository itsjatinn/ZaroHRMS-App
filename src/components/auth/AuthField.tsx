import { useState, type ReactNode } from 'react';
import {
  Platform,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { font } from './fonts';

type AuthFieldProps = TextInputProps & {
  label: string;
  /** Optional control rendered inside the field on the right (e.g. eye toggle). */
  rightSlot?: ReactNode;
  /** Validation message shown below the field; also turns the border red. */
  error?: string;
};

const INK = '#14323F'; // focused state
const IDLE_BORDER = '#CBD5E1'; // slate-300
const ERROR = '#F43F5E'; // rose-500
// outline* and boxShadow are web-only style props: react-native-web applies
// them, but RN's TextStyle type has no idea they exist — hence the cast.
const WEB_INPUT_RESET =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        outlineWidth: 0,
        boxShadow: 'none',
      } as unknown as TextStyle)
    : null;

// Floating-label outlined field. The label sits notched into the top border of
// a rounded box — the notch is a small white-backed pill that covers the border
// line behind the label. Border + label pick up the primary colour on focus
// (rose on error). The right slot holds an icon such as the password toggle.
export default function AuthField({
  label,
  rightSlot,
  error,
  onFocus,
  onBlur,
  style,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? ERROR : focused ? INK : IDLE_BORDER;
  const labelColor = error ? ERROR : focused ? INK : '#64748B'; // slate-500
  const borderWidth = focused || error ? 2 : 1.5;

  return (
    <View className="pt-2">
      <View
        className="h-14 flex-row items-center rounded-2xl bg-white px-4"
        style={{ borderWidth, borderColor }}
      >
        {/* Floating label with a page-colored backing so it does not collide
            with the rounded input border on web. */}
        <View
          className="absolute -top-3 left-4 z-10 bg-canvas px-1.5"
          pointerEvents="none"
        >
          <Text
            className="text-sm"
            style={{ color: labelColor, fontFamily: font.semibold, lineHeight: 18 }}
          >
            {label}
          </Text>
        </View>

        <TextInput
          className="h-full flex-1 py-0 text-base text-ink"
          textAlignVertical="center"
          underlineColorAndroid="transparent"
          placeholderTextColor="#94A3B8"
          style={[{ fontFamily: font.regular }, WEB_INPUT_RESET, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {rightSlot ? <View className="pl-3">{rightSlot}</View> : null}
      </View>

      {error ? (
        <Text className="ml-1 mt-1.5 text-sm text-rose-500">{error}</Text>
      ) : null}
    </View>
  );
}
