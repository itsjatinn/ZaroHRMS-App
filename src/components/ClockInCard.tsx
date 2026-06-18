import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from './shadow';

export default function ClockInCard() {
  // true = currently checked in (default), false = checked out
  const [isCheckedIn, setIsCheckedIn] = useState(true);

  return (
    <View style={cardShadow} className="rounded-3xl bg-[#16202E] p-6">
      {/* Top row: status pill + location */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
          <View className="h-2 w-2 rounded-full bg-[#F5D14E]" />
          <Text className="text-xs font-semibold text-white">Clocked in</Text>
        </View>
        <Text className="text-xs text-white/40">Office · 3F Workbay</Text>
      </View>

      {/* Timer */}
      <View className="mt-5 flex-row items-baseline">
        <Text className="text-6xl font-bold tracking-tight text-white">04:23</Text>
        <Text className="ml-1 text-2xl font-semibold text-white/50">:41</Text>
      </View>
      <Text className="mt-1 text-sm text-white/40">worked today</Text>

      {/* Progress bar (~55%) */}
      <View className="mt-5 h-2 w-full rounded-full bg-white/10">
        <View className="h-2 w-[55%] rounded-full bg-[#F5D14E]" />
      </View>

      {/* Bar labels */}
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-white/40">In at 9:12 AM</Text>
        <Text className="text-xs text-white/40">Target · 8h 00m</Text>
      </View>

      {/* Actions */}
      <View className="mt-6 flex-row gap-3">
        <Pressable
          onPress={() => setIsCheckedIn((prev) => !prev)}
          className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#F5D14E]"
        >
          <Feather
            name={isCheckedIn ? 'log-out' : 'log-in'}
            size={18}
            color="#16202E"
          />
          <Text className="text-base font-bold text-[#16202E]">
            {isCheckedIn ? 'Check out' : 'Check in'}
          </Text>
        </Pressable>

        <Pressable className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <Feather name="message-circle" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
