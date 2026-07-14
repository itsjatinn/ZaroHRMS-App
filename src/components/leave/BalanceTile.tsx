import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';

/** Tile width + carousel gap, exported so scrollers can snap per-card. */
export const TILE_WIDTH = 132;
export const TILE_GAP = 12;

type BalanceTileProps = {
  label: string;
  value: number;
  accent: string; // dot color for this leave type
};

// A single leave-balance tile used inside the horizontal balance carousel:
// small uppercase label with a colored dot (the only color on the card,
// mirroring the home page's leave legend), a big number, and a quiet caption.
export default function BalanceTile({ label, value, accent }: BalanceTileProps) {
  return (
    <View
      style={[cardShadow, { width: TILE_WIDTH }]}
      className="rounded-2xl border border-slate-100 bg-white p-4"
    >
      <View className="flex-row items-center gap-1.5">
        <View
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <Text
          numberOfLines={1}
          className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
        >
          {label}
        </Text>
      </View>
      <Text className="mt-2 text-3xl font-extrabold text-ink">{value}</Text>
      <Text className="mt-0.5 text-[11px] font-medium text-slate-400">
        days left
      </Text>
    </View>
  );
}
