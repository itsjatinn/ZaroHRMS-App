import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';

type BalanceTileProps = {
  label: string;
  value: number;
  accent: string; // dot / accent color for this leave type
};

// A single leave-balance tile used inside the horizontal balance carousel:
// small uppercase label with a colored dot, and a big number.
export default function BalanceTile({ label, value, accent }: BalanceTileProps) {
  return (
    <View
      style={cardShadow}
      className="w-[88px] rounded-xl border border-slate-100 bg-white px-3 py-2.5"
    >
      <View className="flex-row items-center gap-1">
        <View
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <Text className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-xl font-extrabold text-ink">{value}</Text>
    </View>
  );
}
