import { Feather, Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { cardShadow } from './shadow';

export default function PaydayCard() {
  return (
    <View style={cardShadow} className="flex-1 rounded-3xl bg-[#14323F] p-5">
      {/* Top: wallet icon + title */}
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <Ionicons name="wallet-outline" size={18} color="#F5D14E" />
        </View>
        <Text className="text-sm font-semibold text-white">Next payday</Text>
      </View>

      {/* Big date */}
      <Text className="mt-4 text-3xl font-bold text-white">Apr 30</Text>
      <Text className="mt-1 text-xs text-white/40">in 6 days</Text>

      {/* Inner box: last payslip */}
      <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-black/20 p-3">
        <View>
          <Text className="text-[11px] text-white/40">Last payslip</Text>
          <Text className="text-sm font-semibold text-white">₹1,24,500</Text>
        </View>
        <Feather name="arrow-up-right" size={18} color="#F5D14E" />
      </View>
    </View>
  );
}
