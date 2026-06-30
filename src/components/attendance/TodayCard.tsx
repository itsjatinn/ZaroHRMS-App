import { CalendarCheck, LogIn, LogOut, Timer } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';

const dateStr = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

// Demo values for today's attendance.
const CHECK_IN = '09:12 AM';
const CHECK_OUT = '06:30 PM';
const HOURS = '8h 12m';
const PROGRESS = 0.91; // worked vs. the 9h daily target

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 items-center">
      {icon}
      <Text className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </Text>
      <Text className="mt-0.5 text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}

export default function TodayCard() {
  return (
    <View style={cardShadow} className="rounded-2xl bg-white p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <CalendarCheck size={20} color="#2563EB" />
          </View>
          <View>
            <Text className="text-base font-bold text-ink">Today</Text>
            <Text className="text-xs text-slate-400">{dateStr}</Text>
          </View>
        </View>
        <View className="rounded-full bg-emerald-100 px-3 py-1">
          <Text className="text-xs font-semibold text-emerald-700">Present</Text>
        </View>
      </View>

      {/* Check in / out / hours */}
      <View className="mt-5 flex-row">
        <Stat
          icon={<LogIn size={18} color="#059669" />}
          label="Check In"
          value={CHECK_IN}
        />
        <View className="w-px self-stretch bg-slate-100" />
        <Stat
          icon={<LogOut size={18} color="#E11D48" />}
          label="Check Out"
          value={CHECK_OUT}
        />
        <View className="w-px self-stretch bg-slate-100" />
        <Stat
          icon={<Timer size={18} color="#14323F" />}
          label="Hours"
          value={HOURS}
        />
      </View>

      {/* Progress toward the daily target */}
      <View className="mt-5">
        <View className="h-2 w-full rounded-full bg-slate-100">
          <View
            className="h-2 rounded-full bg-[#F5D14E]"
            style={{ width: `${PROGRESS * 100}%` }}
          />
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">Daily target · 9h 00m</Text>
          <Text className="text-xs font-semibold text-ink">
            {Math.round(PROGRESS * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
}
