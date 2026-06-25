import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { font } from './fonts';

type AuthFieldProps = TextInputProps & {
  label: string;
  /** "filled" = grey box (default), "outlined" = white box with border. */
  variant?: 'filled' | 'outlined';
  /** Optional control rendered inside the field on the right (e.g. Show toggle). */
  rightSlot?: ReactNode;
  /** Validation message shown below the field; also turns the border red. */
  error?: string;
};

// Labelled text input matching the auth mockups. The label sits above a rounded
// field; `variant` switches between the grey and bordered-white styles, and
// `error` surfaces a red border + helper message.
export default function AuthField({
  label,
  variant = 'filled',
  rightSlot,
  error,
  ...inputProps
}: AuthFieldProps) {
  let boxClass =
    variant === 'outlined'
      ? 'border border-slate-300 bg-white'
      : 'bg-slate-200/70';
  if (error) boxClass = 'border border-rose-400 bg-rose-50';

  return (
    <View>
      <Text
        className="mb-2 text-xs uppercase text-slate-700"
        style={{ fontFamily: font.bold, letterSpacing: 0.5 }}
      >
        {label}
      </Text>
      <View
        className={`h-14 flex-row items-center rounded-2xl px-4 ${boxClass}`}
      >
        <TextInput
          className="flex-1 text-base text-ink"
          placeholderTextColor="#94A3B8"
          {...inputProps}
        />
        {rightSlot ? <View className="pl-3">{rightSlot}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1.5 text-sm text-rose-500">{error}</Text>
      ) : null}
    </View>
  );
}
