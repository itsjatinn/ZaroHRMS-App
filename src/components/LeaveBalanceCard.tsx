import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type LeaveType = {
  label: string;
  used: number;
  total?: number;
  color: string;
};

const LEAVES: LeaveType[] = [
  { label: 'Casual', used: 5, total: 12, color: '#E0785C' },
  { label: 'Sick', used: 4, total: 7, color: '#57A773' },
  { label: 'Earned', used: 5.5, total: 18, color: '#D9A53B' },
  { label: 'Comp-off', used: 2, color: '#7C6FE0' },
];

const DAYS_LEFT = 22.5;

// Donut sizing
const SIZE = 120;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 5; // px gap between segments

function Donut() {
  // Segments are sized by each type's total capacity (Comp-off defaults to 3).
  const weights = LEAVES.map((l) => l.total ?? 3);
  const sum = weights.reduce((a, b) => a + b, 0);

  let offset = 0;
  const segments = LEAVES.map((leave, i) => {
    const frac = weights[i] / sum;
    const arc = frac * C;
    const seg = {
      color: leave.color,
      dash: Math.max(arc - GAP, 0),
      offset,
    };
    offset += arc;
    return seg;
  });

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE}>
        {segments.map((s, i) => (
          <Circle
            key={i}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth={STROKE}
            strokeDasharray={`${s.dash} ${C}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
            // start at the top (12 o'clock) instead of 3 o'clock
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        ))}
      </Svg>

      {/* Center label */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-2xl font-bold text-ink">{DAYS_LEFT}</Text>
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Days left
        </Text>
      </View>
    </View>
  );
}

export default function LeaveBalanceCard() {
  const router = useRouter();

  return (
    <View className="rounded-[24px] border border-slate-100 bg-white px-5 py-5">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-ink">Leave balance</Text>
          <Text className="mt-0.5 text-xs font-medium text-slate-400">
            FY26 entitlement usage
          </Text>
        </View>
        <View className="rounded-full bg-[#F1CE6C]/25 px-3 py-1">
          <Text className="text-xs font-bold text-[#8A6816]">
            {DAYS_LEFT} days left
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row items-center">
        <Donut />

        <View className="ml-5 flex-1 gap-3">
          {LEAVES.map((leave, index) => (
            <View
              key={leave.label}
              className={`flex-row items-center justify-between pb-2 ${
                index === LEAVES.length - 1 ? '' : 'border-b border-slate-100'
              }`}
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: leave.color }}
                />
                <Text className="text-sm text-slate-500">{leave.label}</Text>
              </View>
              <Text className="text-sm font-bold text-ink">
                {leave.used}
                {leave.total != null ? ` / ${leave.total}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <Pressable
          onPress={() => router.push('/apply-leave')}
          className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#14323F] px-4 transition duration-200 active:scale-[0.98] active:bg-[#D9A53B]"
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text className="text-sm font-bold text-white">Apply leave</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/holidays')}
          className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 transition duration-200 active:scale-[0.98] active:bg-slate-50"
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={18}
            color="#14323F"
          />
          <Text className="text-sm font-bold text-ink">Calendar</Text>
        </Pressable>
      </View>
    </View>
  );
}
