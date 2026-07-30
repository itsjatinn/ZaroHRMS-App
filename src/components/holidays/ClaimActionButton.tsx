import { Pressable, Text, View } from 'react-native';

import type { ClaimActionSpec } from './holidayCalendarData';

type ClaimActionButtonProps = {
  spec: ClaimActionSpec;
  onPress: () => void;
  /** Full-width variant used inside the selected-day panel. */
  block?: boolean;
};

// The claim control shared by the calendar day panel and the list rows —
// "Claim holiday" (primary), "Withdraw / Cancel" (ghost) and the inert
// "Claim closed" text, same three states as the web calendar.
export default function ClaimActionButton({
  spec,
  onPress,
  block = false,
}: ClaimActionButtonProps) {
  if (spec.tone === 'muted') {
    return (
      <View className={block ? 'py-1' : 'items-end'}>
        <Text className="text-[11px] font-semibold text-slate-400">
          {spec.label}
        </Text>
      </View>
    );
  }

  const ghost = spec.tone === 'ghost';
  const disabled = spec.disabled || !spec.action;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={spec.label}
      style={disabled ? { opacity: 0.45 } : undefined}
      className={`${block ? 'w-full' : 'min-w-[92px]'} items-center justify-center rounded-xl border px-3 py-2 ${
        ghost
          ? 'border-[#E0785C]/40 bg-white'
          : 'border-[#14323F] bg-[#14323F]'
      } ${disabled ? '' : 'active:scale-95'}`}
    >
      <Text
        className={`text-center text-[11.5px] font-semibold ${
          ghost ? 'text-[#B04A2A]' : 'text-white'
        }`}
        numberOfLines={1}
      >
        {spec.label}
      </Text>
    </Pressable>
  );
}
