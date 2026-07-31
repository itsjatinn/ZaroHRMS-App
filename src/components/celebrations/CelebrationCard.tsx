import {
  Cake,
  Check,
  Hand,
  Heart,
  PartyPopper,
  Send,
} from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, Text, View, type ViewStyle } from 'react-native';

import { cardShadow } from '../shadow';
import {
  avatarColorForEmployee,
  BRAND_PRIMARY,
  brandAlpha,
  initialsFor,
  isWishOpen,
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
  birthday: (color, size) => (
    <Cake size={size} color={color} strokeWidth={2.4} />
  ),
  anniversary: (color, size) => (
    <PartyPopper size={size} color={color} strokeWidth={2.4} />
  ),
  marriageAnniversary: (color, size) => (
    <Heart size={size} color={color} strokeWidth={2.4} />
  ),
  newJoiner: (color, size) => (
    <Hand size={size} color={color} strokeWidth={2.4} />
  ),
};

// The kind badge floats over the avatar's corner, so it needs to lift off both
// the avatar colour and the card surface.
const chipShadow: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 5,
  elevation: 3,
};

type Props = {
  celebration: Celebration;
  /** Today's cards get a tinted border + fill so they stand out in the hero. */
  highlight?: boolean;
  /** A wish has already gone out — the action button locks into a sent state. */
  wished?: boolean;
  onPressAction?: (celebration: Celebration) => void;
};

export default function CelebrationCard({
  celebration,
  highlight = false,
  wished = false,
  onPressAction,
}: Props) {
  const meta = KIND_META[celebration.kind];
  const canWish = isWishOpen(celebration);
  // A broken photo URL falls back to initials instead of an empty circle.
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = !photoFailed ? celebration.profilePhoto : null;

  return (
    <View
      // Shared app card chrome — matches the home cards.
      className="flex-row items-center gap-3 rounded-[22px] border border-slate-100 bg-white px-4 py-4"
      style={[
        cardShadow,
        // Today's cards take the kind colour on the border, as on the web.
        highlight ? { borderColor: meta.color + '59' } : null,
      ]}
    >
      {/* Read-only, as on the web — the wish button is the card's only action. */}
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        {/* Round initials avatar with the kind icon chipped into the corner */}
        <View className="h-11 w-11">
          {photo ? (
            // The server photo when there is one, as on the web; the coloured
            // initials circle stays the fallback.
            <Image
              source={{ uri: photo }}
              onError={() => setPhotoFailed(true)}
              accessibilityIgnoresInvertColors
              className="h-11 w-11 rounded-full"
              style={{ backgroundColor: brandAlpha(0.08) }}
            />
          ) : (
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: avatarColorForEmployee(
                  celebration.employeeId,
                  celebration.avatarBg,
                ),
              }}
            >
              <Text className="text-sm font-bold text-white">
                {initialsFor(celebration.name)}
              </Text>
            </View>
          )}
          <View
            className="absolute -bottom-[5px] -right-[5px] h-6 w-6 items-center justify-center rounded-full bg-white"
            style={chipShadow}
          >
            {KIND_ICON[celebration.kind](meta.color, 13)}
          </View>
        </View>

        <View className="min-w-0 flex-1">
          <Text
            className="text-sm font-bold"
            style={{ color: BRAND_PRIMARY }}
            numberOfLines={1}
          >
            {celebration.name}
          </Text>
          {celebration.designation ? (
            <Text
              className="text-xs font-semibold"
              style={{ color: brandAlpha(0.6) }}
              numberOfLines={1}
            >
              {celebration.designation}
              {celebration.team ? ` · ${celebration.team}` : ''}
            </Text>
          ) : null}
          <View
            className="mt-1 self-start rounded-full px-2 py-[2px]"
            style={{ backgroundColor: meta.bg }}
          >
            <Text
              className="text-[11px] font-bold"
              style={{ color: meta.color }}
              numberOfLines={1}
            >
              {metaLineFor(celebration)}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => onPressAction?.(celebration)}
        disabled={wished || !canWish}
        accessibilityRole="button"
        accessibilityState={{ disabled: wished || !canWish }}
        accessibilityLabel={
          wished
            ? `Already wished ${celebration.name}`
            : canWish
              ? `${meta.action} ${celebration.name}`
              : 'Wishes are not open yet'
        }
        className="flex-row items-center gap-1 self-center rounded-lg border bg-white px-3 py-1.5 active:scale-95"
        style={
          wished
            ? {
                borderColor: 'rgba(94, 155, 123, 0.45)',
                backgroundColor: 'rgba(94, 155, 123, 0.14)',
              }
            : { borderColor: brandAlpha(0.12) }
        }
      >
        {wished ? (
          <Check size={13} color="#3F7B58" />
        ) : (
          <Send size={13} color={BRAND_PRIMARY} />
        )}
        <Text
          className="text-xs font-bold"
          style={{ color: wished ? '#3F7B58' : BRAND_PRIMARY }}
        >
          {wished ? 'Wished' : canWish ? meta.action : 'Locked'}
        </Text>
      </Pressable>
    </View>
  );
}
