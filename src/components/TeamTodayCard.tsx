import { Text, View } from 'react-native';

import { cardShadow } from './shadow';

const AVATARS = [
  { initials: 'AK', bg: 'bg-indigo-500' },
  { initials: 'RN', bg: 'bg-rose-500' },
  { initials: 'PV', bg: 'bg-emerald-500' },
  { initials: 'ST', bg: 'bg-amber-500' },
];

export default function TeamTodayCard() {
  return (
    <View style={cardShadow} className="flex-1 rounded-3xl bg-white p-5">
      {/* Title + status pill */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-ink">Team today</Text>
        <View className="rounded-full bg-slate-100 px-2.5 py-1">
          <Text className="text-xs text-slate-500">8 in · 2 wfh</Text>
        </View>
      </View>

      {/* Overlapping avatars */}
      <View className="mt-4 flex-row">
        {AVATARS.map((avatar, index) => (
          <View
            key={avatar.initials}
            className={`h-8 w-8 items-center justify-center rounded-full border-2 border-white ${avatar.bg} ${index > 0 ? '-ml-2' : ''}`}
          >
            <Text className="text-[10px] font-semibold text-white">
              {avatar.initials}
            </Text>
          </View>
        ))}
        <View className="-ml-2 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200">
          <Text className="text-[10px] font-semibold text-slate-600">+6</Text>
        </View>
      </View>

      {/* Footer note */}
      <Text className="mt-3 text-xs text-slate-500">
        <Text className="font-semibold text-ink">Priya</Text> is on leave today ·
        returns Apr 28
      </Text>
    </View>
  );
}
