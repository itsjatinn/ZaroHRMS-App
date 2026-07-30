import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';

/** Tile width + carousel gap, exported so scrollers can snap per-card. */
export const TILE_WIDTH = 132;
export const TILE_GAP = 12;

type BalanceTileProps = {
  label: string;
  value: number;
  accent: string; // dot color for this leave type
  /** Marks the tile whose leave type is currently chosen. */
  selected?: boolean;
  /**
   * Balance left if the request in progress goes through. Shown on the selected
   * tile so the impact sits with the number it affects, rather than in a
   * separate card.
   */
  remainingAfter?: number | null;
  /** Selects this leave type. Omit to render a plain, non-interactive tile. */
  onPress?: () => void;
};

// A single leave-balance tile used inside the horizontal balance carousel:
// small uppercase label with a colored dot (the only color on the card,
// mirroring the home page's leave legend), a big number, and a quiet caption.
//
// With onPress it doubles as the leave-type selector, the same way the web's
// balance tiles do — tapping one picks that type in the form below.
/** Whole numbers bare, halves with one decimal. */
function formatDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function BalanceTile({
  label,
  value,
  accent,
  selected = false,
  remainingAfter = null,
  onPress,
}: BalanceTileProps) {
  const body = (
    <>
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
      {typeof remainingAfter === 'number' ? (
        <Text
          className="mt-0.5 text-[11px] font-semibold"
          style={{ color: accent }}
          numberOfLines={1}
        >
          {formatDays(remainingAfter)} after apply
        </Text>
      ) : null}
    </>
  );

  // The selected tile takes the type's own accent on its border, so the link
  // between the tile and the dropdown below is visible at a glance.
  const surface = selected
    ? { width: TILE_WIDTH, borderColor: accent, borderWidth: 1.5 }
    : { width: TILE_WIDTH };

  if (!onPress) {
    return (
      <View
        style={[cardShadow, surface]}
        className="rounded-2xl border border-slate-100 bg-white p-4"
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value} days left`}
      accessibilityState={{ selected }}
      style={[cardShadow, surface]}
      className="rounded-2xl border border-slate-100 bg-white p-4 active:scale-[0.98]"
    >
      {body}
    </Pressable>
  );
}
