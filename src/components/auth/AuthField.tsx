import { useState, type ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

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
    <View>
      <View
        className="h-14 flex-row items-center rounded-2xl bg-white px-4"
        style={{ borderWidth, borderColor }}
      >
        {/* Notched floating label. Its background is split so the top half
            matches the page (canvas) and the bottom half matches the field
            (white) — the label straddles the border line and blends into both. */}
        <View
          className="absolute -top-2.5 left-3 px-1.5"
          pointerEvents="none"
        >
          {/* Two-tone backing: top half = page bg, bottom half = field bg */}
          <View className="absolute inset-0 overflow-hidden rounded-[4px]">
            <View className="h-1/2 w-full bg-canvas" />
            <View className="h-1/2 w-full bg-white" />
          </View>
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
          style={[{ fontFamily: font.regular }, style]}
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
