import { Camera } from 'lucide-react-native';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { PROFILE } from './profileData';

const AVATAR = 104;

// Profile hero: a square avatar floating over the top edge of a soft card, with
// the name and a divided "type · role" subtitle below (camera edit retained).
export default function ProfileHeader() {
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
              <Image
                source={{ uri: PROFILE.avatar }}
                className="h-full w-full rounded-[20px]"
              />
            </View>
            <Pressable
              onPress={() => Alert.alert('Change photo', 'Photo upload coming soon.')}
              className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-[#F5D14E] active:scale-95"
            >
              <Camera size={14} color="#14323F" />
            </Pressable>
          </View>
        </View>

        {/* Name */}
        <Text className="text-2xl font-bold text-white">{PROFILE.name}</Text>

        {/* Divided subtitle: type | role */}
        <View className="mt-2 flex-row items-center">
          <Text className="text-sm text-white/60">Employee</Text>
          <View className="mx-3 h-3.5 w-px bg-white/25" />
          <Text className="text-sm text-white/60">{PROFILE.designation}</Text>
        </View>

        {/* Meta row: employee id */}
        <View className="mt-3 rounded-full bg-white/10 px-3 py-1">
          <Text className="text-xs font-semibold text-white/80">
            {PROFILE.employeeId}
          </Text>
        </View>
      </View>
    </View>
  );
}
