import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { FEATURED_HOLIDAY as F } from './holidaysData';

// Highlighted card for the next upcoming holiday.
export default function FeaturedHolidayCard() {
  return (
    <View style={cardShadow} className="flex-row items-center gap-4 rounded-[24px] border border-[#F4D9CE] bg-[#FBEDE7] p-4">
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-rose-100 bg-white">
        <Text className="text-2xl font-bold text-ink">{F.day}</Text>
        <Text className="text-[11px] font-semibold uppercase text-slate-400">{F.month}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#C0552F]">
          {F.countdown}
        </Text>
        <Text className="mt-0.5 text-lg font-bold text-ink">{F.name}</Text>
        <View className="mt-1.5 flex-row items-center gap-2">
          <View className="rounded-md bg-[#F6D8CE] px-2 py-0.5">
            <Text className="text-xs font-semibold text-[#C0552F]">{F.type}</Text>
          </View>
          <Text className="text-xs text-slate-400">· {F.note}</Text>
        </View>
      </View>
    </View>
  );
}
