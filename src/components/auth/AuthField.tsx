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

// Primary colour used for the focused state (the app's ink).
const INK = '#14323F';
const IDLE_BORDER = '#CBD5E1'; // slate-300
const ERROR = '#F43F5E'; // rose-500

// Floating-label outlined field: the label sits notched into the top border of
// a rounded box, and the border + label pick up the primary colour on focus
// (rose on error). The right slot holds an icon such as the password toggle.
export default function AuthField({
  label,
  rightSlot,
  error,
  onFocus,
  onBlur,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);

  const color = error ? ERROR : focused ? INK : IDLE_BORDER;
  const labelColor = error ? ERROR : focused ? INK : '#64748B'; // slate-500

  return (
    <View>
      <View
        className="h-16 flex-row items-center rounded-2xl bg-white px-4"
        style={{ borderWidth: focused || error ? 2 : 1.5, borderColor: color }}
      >
        {/* Notched floating label — the white background "cuts" the border line */}
        <View
          className="absolute -top-2.5 left-3 flex-row bg-white px-1.5"
          pointerEvents="none"
        >
          <Text
            className="text-sm"
            style={{ color: labelColor, fontFamily: font.semibold }}
          >
            {label}
          </Text>
        </View>

        <TextInput
          className="flex-1 text-base text-ink"
          placeholderTextColor="#94A3B8"
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
