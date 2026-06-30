import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cardShadow } from './shadow';

const PROGRESS = '#D9A53B';
const TRACK = '#E2E2DE';

const TOTAL_STEPS = 5;
const DONE_STEPS = 1;
const PERCENT = Math.round((DONE_STEPS / TOTAL_STEPS) * 100);

// Ring sizing
const SIZE = 64;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function ProgressRing() {
  const arc = (PERCENT / 100) * C;

  return (
    <Svg width={SIZE} height={SIZE}>
      {/* Track */}
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={TRACK}
        strokeWidth={STROKE}
      />
      {/* Progress */}
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={PROGRESS}
        strokeWidth={STROKE}
        strokeDasharray={`${arc} ${C}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
    </Svg>
  );
}

export default function ProfileCompletionCard() {
  const router = useRouter();

  return (
    <View
      style={cardShadow}
      className="flex-row items-center rounded-3xl bg-[#F4F4F2] p-5"
    >
      <ProgressRing />

      {/* Progress text */}
      <View className="ml-4 flex-1">
        <Text className="text-2xl font-bold text-ink">{PERCENT}%</Text>
        <Text className="mt-0.5 text-sm font-semibold text-[#C0552F]">
          {TOTAL_STEPS - DONE_STEPS} items left
        </Text>
      </View>

      {/* View profile chip */}
      <Pressable
        onPress={() => router.push('/settings')}
        hitSlop={8}
        className="flex-row items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 active:scale-95"
      >
        <Text className="text-sm font-semibold text-slate-600">View profile</Text>
        <Feather name="arrow-right" size={15} color="#475569" />
      </Pressable>
    </View>
  );
}
