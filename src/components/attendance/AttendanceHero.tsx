import { LogIn, LogOut, Timer } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cardShadow } from '../shadow';

// This month's attendance rate (present days / working days).
const PRESENT = 18;
const WORKING = 22;
const PERCENT = Math.round((PRESENT / WORKING) * 100);

const CHECK_IN = '09:12 AM';
const CHECK_OUT = '06:30 PM';
const HOURS = '8h 12m';

const dateStr = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

// Ring sizing
const SIZE = 92;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function Ring() {
  const arc = (PERCENT / 100) * C;
  return (
    <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={STROKE} />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#F5D14E"
          strokeWidth={STROKE}
          strokeDasharray={`${arc} ${C}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <Text className="text-lg font-bold text-white">{PERCENT}%</Text>
      <Text className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
        Present
      </Text>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      {icon}
      <Text className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </Text>
      <Text className="mt-0.5 text-sm font-bold text-white">{value}</Text>
    </View>
  );
}

// Ink hero: month attendance ring + today's status + check in/out/hours.
export default function AttendanceHero() {
  return (
    <View style={cardShadow} className="overflow-hidden rounded-[28px] bg-ink p-5">
      {/* Top: ring + this-month summary */}
      <View className="flex-row items-center">
        <Ring />
        <View className="ml-4 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-white">Today</Text>
            <View className="rounded-full bg-emerald-400/20 px-2.5 py-0.5">
              <Text className="text-[11px] font-bold text-emerald-300">Present</Text>
            </View>
          </View>
          <Text className="mt-0.5 text-xs text-white/50">{dateStr}</Text>
          <Text className="mt-2 text-[13px] leading-5 text-white/70">
            {PRESENT} of {WORKING} working days present this month.
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="my-4 h-px bg-white/10" />

      {/* Today's check in / out / hours */}
      <View className="flex-row">
        <Stat icon={<LogIn size={18} color="#34D399" />} label="Check In" value={CHECK_IN} />
        <View className="w-px self-stretch bg-white/10" />
        <Stat icon={<LogOut size={18} color="#FB7185" />} label="Check Out" value={CHECK_OUT} />
        <View className="w-px self-stretch bg-white/10" />
        <Stat icon={<Timer size={18} color="#F5D14E" />} label="Hours" value={HOURS} />
      </View>
    </View>
  );
}
