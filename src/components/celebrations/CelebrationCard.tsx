import { Cake, Check, Hand, PartyPopper, Send } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  initialsFor,
  KIND_META,
  metaLineFor,
  type Celebration,
  type CelebrationKind,
} from './celebrationsData';

// Icons live here rather than in the data file so the data stays plain values,
// matching the other feature folders.
const KIND_ICON: Record<
  CelebrationKind,
  (color: string, size: number) => React.ReactNode
> = {
  birthday: (color, size) => <Cake size={size} color={color} />,
  anniversary: (color, size) => <PartyPopper size={size} color={color} />,
  newJoiner: (color, size) => <Hand size={size} color={color} />,
};

type Props = {
  celebration: Celebration;
  /** Today's cards get a tinted border + fill so they stand out in the hero. */
  highlight?: boolean;
  /** A note has already gone out — the action button locks into a sent state. */
  wished?: boolean;
  onPressPerson?: (employeeId: string) => void;
  onPressAction?: (celebration: Celebration) => void;
};

export default function CelebrationCard({
  celebration,
  highlight = false,
  wished = false,
  onPressPerson,
  onPressAction,
}: Props) {
  const meta = KIND_META[celebration.kind];

  return (
    <View
      style={[
        cardShadow,
        highlight
          ? { borderColor: meta.color + '59', backgroundColor: meta.bg }
          : undefined,
      ]}
      className="rounded-[22px] border border-slate-100 bg-white p-4"
    >
      <Pressable
        onPress={() => onPressPerson?.(celebration.employeeId)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${celebration.name}'s profile`}
        className="flex-row items-center gap-3 active:opacity-70"
      >
        {/* Initials avatar with a small kind badge tucked into the corner */}
        <View className="h-12 w-12">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: celebration.avatarBg ?? '#14323F' }}
          >
            <Text className="text-sm font-bold text-white">
              {initialsFor(celebration.name)}
            </Text>
          </View>
          <View
            className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white"
            style={{ backgroundColor: meta.bg }}
          >
            {KIND_ICON[celebration.kind](meta.color, 12)}
          </View>
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
            {celebration.name}
          </Text>
          {celebration.designation ? (
            <Text className="text-xs text-slate-400" numberOfLines={1}>
              {celebration.designation}
              {celebration.team ? ` · ${celebration.team}` : ''}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View className="mt-3 flex-row items-center justify-between gap-3">
        <View
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5"
          style={{ backgroundColor: meta.bg }}
        >
          {KIND_ICON[celebration.kind](meta.color, 12)}
          <Text
            className="text-[11px] font-semibold"
            style={{ color: meta.color }}
          >
            {metaLineFor(celebration)}
          </Text>
        </View>

        <Pressable
          onPress={() => onPressAction?.(celebration)}
          disabled={wished}
          accessibilityRole="button"
          accessibilityState={{ disabled: wished }}
          accessibilityLabel={
            wished
              ? `${meta.sent} ${celebration.name}`
              : `${meta.action} ${celebration.name}`
          }
          className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
            wished
              ? 'border-[#CFE6D4] bg-[#E6F4EA]'
              : 'border-slate-200 bg-white active:scale-95'
          }`}
        >
          {wished ? (
            <Check size={12} color="#3F8F5B" />
          ) : (
            <Send size={12} color="#14323F" />
          )}
          <Text
            className={`text-[11px] font-semibold ${
              wished ? 'text-[#3F8F5B]' : 'text-ink'
            }`}
          >
            {wished ? meta.sent : meta.action}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
