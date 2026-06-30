import { Camera } from 'lucide-react-native';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { PROFILE } from './profileData';

// Profile hero: avatar (with photo-edit button), name, designation, id, status.
export default function ProfileHeader() {
  return (
    <View style={cardShadow} className="items-center rounded-2xl bg-white p-6">
      <View className="relative h-20 w-20">
        <View className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#F5D14E]">
          <Image source={{ uri: PROFILE.avatar }} className="h-full w-full" />
        </View>
        <Pressable
          onPress={() => Alert.alert('Change photo', 'Photo upload coming soon.')}
          className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#F5D14E]"
        >
          <Camera size={13} color="#14323F" />
        </Pressable>
      </View>

      <Text className="mt-3 text-lg font-bold text-ink">{PROFILE.name}</Text>
      <Text className="text-sm text-slate-400">{PROFILE.designation}</Text>

      <View className="mt-3 flex-row items-center gap-2">
        <View className="rounded-full bg-slate-100 px-3 py-1">
          <Text className="text-xs font-semibold text-slate-600">
            {PROFILE.employeeId}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1">
          <View className="h-2 w-2 rounded-full bg-emerald-500" />
          <Text className="text-xs font-semibold text-emerald-700">Online</Text>
        </View>
      </View>
    </View>
  );
}
