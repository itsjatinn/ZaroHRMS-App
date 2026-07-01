import { Palmtree } from 'lucide-react-native';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { HOLIDAYS } from './holidaysData';

// Full list of holidays with tinted date-boxes.
export default function HolidayListCard() {
  return (
    <View style={cardShadow} className="rounded-[24px] border border-slate-100 bg-white p-5">
      <View className="mb-2 flex-row items-center gap-2">
        <Palmtree size={18} color="#3F8F5B" />
        <Text className="text-base font-bold text-ink">Holiday Calendar 2026</Text>
      </View>
      {HOLIDAYS.map((h, i) => (
        <Fragment key={h.name}>
          {i > 0 && <View className="my-3 border-b border-dashed border-slate-200" />}
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: h.bg }}>
              <Text className="text-xl font-bold" style={{ color: h.text }}>{h.day}</Text>
              <Text className="text-[10px] font-semibold uppercase" style={{ color: h.text }}>{h.month}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{h.name}</Text>
              <Text className="text-xs text-slate-400">{h.type} · {h.note}</Text>
            </View>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
