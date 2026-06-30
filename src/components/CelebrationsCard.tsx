import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { cardShadow } from './shadow';

export default function CelebrationsCard() {
  return (
    <View style={cardShadow} className="flex-1 rounded-3xl bg-[#FBF3D5] p-5">
      {/* Cake icon + birthday */}
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F5D14E]">
          <MaterialCommunityIcons name="cake-variant" size={20} color="#16202E" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">Rohit's birthday</Text>
          <Text className="text-xs text-slate-500">Today · send a note</Text>
        </View>
      </View>

      {/* Footer note */}
      <Text className="mt-4 text-xs text-slate-500">
        + 2 work anniversaries this week
      </Text>
    </View>
  );
}
