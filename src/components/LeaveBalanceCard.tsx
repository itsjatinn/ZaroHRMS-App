import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from './shadow';

export default function LeaveBalanceCard() {
  const router = useRouter();

  return (
    <View style={cardShadow} className="flex-1 rounded-3xl bg-white p-5">
      {/* Top: palm icon + title + arrow */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F5D14E]/20">
            <MaterialCommunityIcons name="palm-tree" size={18} color="#C99A1F" />
          </View>
          <Text className="text-sm font-semibold text-ink">Leave balance</Text>
        </View>
        <Pressable onPress={() => router.push('/leave')} hitSlop={8}>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Big number */}
      <View className="mt-4 flex-row items-baseline">
        <Text className="text-4xl font-bold text-ink">12</Text>
        <Text className="ml-1 text-xs text-slate-400">/ 20 days left</Text>
      </View>

      {/* Thin progress bar (earned + sick) */}
      <View className="mt-3 h-1.5 w-full flex-row overflow-hidden rounded-full bg-slate-100">
        <View className="h-full w-[30%] bg-emerald-500" />
        <View className="h-full w-[10%] bg-[#F5D14E]" />
      </View>

      {/* Legend dots */}
      <View className="mt-3 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-emerald-500" />
          <Text className="text-xs text-slate-500">Earned 6</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-[#F5D14E]" />
          <Text className="text-xs text-slate-500">Sick 2</Text>
        </View>
      </View>
    </View>
  );
}
