import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export default function CelebrationsCard() {
  return (
    <View className="flex-1 rounded-[22px] border border-[#EADDA9] bg-[#FBF3D5] p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F5D14E]">
          <MaterialCommunityIcons name="cake-variant" size={20} color="#16202E" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">Rohit's birthday</Text>
          <Text className="text-xs text-slate-500">Today · send a note</Text>
        </View>
      </View>

      <Text className="mt-4 text-xs text-slate-500">
        + 2 work anniversaries this week
      </Text>
    </View>
  );
}
