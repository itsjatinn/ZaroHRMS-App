import { Camera } from 'lucide-react-native';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { getInitials } from './initials';
import { PROFILE } from './profileData';

const AVATAR = 104;

type Props = {
  /** Live identity — the demo profile renders when absent. */
  name?: string;
  /** Explicit null/blank = live session with none set; the row is hidden. */
  designation?: string | null;
  /** Explicit null = live session with no code yet; the pill is hidden. */
  employeeId?: string | null;
  /** Explicit null = live session with no photo -> initials, not the sample. */
  avatar?: string | null;
  /** Used only to derive the initials fallback. */
  email?: string | null;
  /** Opens the photo picker. Omit to render the avatar without the control. */
  onEditPhoto?: () => void;
  /** Shows a spinner over the avatar while a new photo is saving. */
  savingPhoto?: boolean;
  /**
   * Stats strip along the bottom of the card (Tenure / Joined / Type), the
   * same trio the web's profile hero shows. Entries with no value drop out.
   */
  stats?: { label: string; value?: string | null }[];
};

// Profile hero: a square avatar floating over the top edge of a soft card, with
// the name and a divided "type · role" subtitle below (camera edit retained).
export default function ProfileHeader({
  name,
  designation,
  employeeId,
  avatar,
  email,
  onEditPhoto,
  savingPhoto = false,
  stats = [],
}: Props) {
  const shownName = name?.trim() || PROFILE.name;
  // undefined = no live identity supplied (demo) -> the sample designation.
  // Blank on a live session -> show nothing rather than a stale mock title.
  const shownDesignation =
    designation === undefined
      ? PROFILE.designation
      : designation?.trim() || null;
  // undefined = no live identity supplied (demo) -> the sample id. null or
  // blank = live but codeless -> show nothing rather than a stale mock id.
  const shownId =
    employeeId === undefined ? PROFILE.employeeId : employeeId?.trim() || null;
  // undefined = demo session -> the sample portrait. null/blank on a live
  // session means no photo is set, and a stock face would misrepresent the
  // employee, so their initials stand in (as on the web).
  const shownAvatar = avatar === undefined ? PROFILE.avatar : avatar || null;
  const shownStats = stats.filter(
    (stat) => stat.value && stat.value.trim() && stat.value !== '—',
  );
  return (
    // Extra top margin/padding leaves room for the avatar that overhangs the card.
    <View style={{ marginTop: AVATAR / 2 }}>
      <View
        style={[cardShadow, { paddingTop: AVATAR / 2 + 10 }]}
        className="items-center rounded-[28px] bg-ink px-6 pb-6"
      >
        {/* Square avatar — overlaps the card's top edge, ringed to lift it off */}
        <View
          style={{ top: -(AVATAR / 2) }}
          className="absolute self-center"
        >
          <View className="relative" style={{ height: AVATAR, width: AVATAR }}>
            {/* Gold ring + a thin card-colored gap around the image */}
            <View className="h-full w-full overflow-hidden rounded-[26px] border-2 border-[#F5D14E] bg-ink p-1">
              {shownAvatar ? (
                <Image
                  source={{ uri: shownAvatar }}
                  className="h-full w-full rounded-[20px]"
                />
              ) : (
                <View className="h-full w-full items-center justify-center rounded-[20px] bg-white/10">
                  <Text className="text-3xl font-bold text-white">
                    {getInitials(shownName, email)}
                  </Text>
                </View>
              )}
            </View>
            {savingPhoto ? (
              <View className="absolute inset-0 items-center justify-center rounded-[26px] bg-black/45">
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
            {onEditPhoto ? (
              <Pressable
                onPress={onEditPhoto}
                disabled={savingPhoto}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-[#F5D14E] active:scale-95"
              >
                <Camera size={14} color="#14323F" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Name */}
        <Text className="text-2xl font-bold text-white">{shownName}</Text>

        {/* Divided subtitle: employee code | designation. Each side is
            dropped when its value is missing, so the divider never dangles
            beside an empty half. */}
        {shownId || shownDesignation ? (
          <View className="mt-2 flex-row items-center">
            {shownId ? (
              <Text className="text-sm text-white/60">{shownId}</Text>
            ) : null}
            {shownId && shownDesignation ? (
              <View className="mx-3 h-3.5 w-px bg-white/25" />
            ) : null}
            {shownDesignation ? (
              <Text className="text-sm text-white/60" numberOfLines={1}>
                {shownDesignation}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Stats strip: only entries that actually have a value, so the card
            never shows a labelled blank. */}
        {shownStats.length ? (
          <View className="mt-5 w-full flex-row items-stretch rounded-2xl bg-white/10 px-1 py-3">
            {shownStats.map((stat, index) => (
              <View key={stat.label} className="flex-1 flex-row">
                {index > 0 ? <View className="w-px bg-white/15" /> : null}
                <View className="flex-1 items-center px-1">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                    {stat.label}
                  </Text>
                  <Text
                    className="mt-1 text-sm font-bold text-white"
                    numberOfLines={1}
                  >
                    {stat.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
