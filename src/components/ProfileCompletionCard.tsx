import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cardShadow } from './shadow';

// Profile-completion progress. Swap DONE_STEPS for real data when wired up.
export const TOTAL_STEPS = 5;
export const DONE_STEPS = 1;
export const PERCENT = Math.round((DONE_STEPS / TOTAL_STEPS) * 100);
export const ITEMS_LEFT = TOTAL_STEPS - DONE_STEPS;
export const PROFILE_INCOMPLETE = DONE_STEPS < TOTAL_STEPS;

const PROGRESS = '#14323F'; // ink teal (brand primary)
const TRACK = '#D2E0E1';

// Ring sizing
const SIZE = 76;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function ProgressRing() {
  const arc = (PERCENT / 100) * C;

  return (
    <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={TRACK}
          strokeWidth={STROKE}
        />
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
      <Text className="text-lg font-bold text-ink">{PERCENT}%</Text>
    </View>
  );
}

/**
 * The body of the profile-completion card: ring + heading + CTA. Shared by the
 * home-screen card and the first-load popup so they look identical.
 */
export function ProfileCompletionBody() {
  const router = useRouter();

  return (
    <View className="flex-row items-center">
      <ProgressRing />

      <View className="ml-4 flex-1">
        <Text className="text-[17px] font-bold text-ink">
          Complete your profile
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-[#5B7B82]">
          Finish setting up to help your team reach you.
        </Text>

        <Pressable
          onPress={() => router.push('/view-profile')}
          className="mt-3 flex-row items-center gap-1.5 self-start rounded-full bg-ink px-4 py-2.5 active:scale-[0.98]"
        >
          <Text className="text-[13px] font-bold text-white">Complete profile</Text>
          <Feather name="arrow-right" size={15} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileCompletionCard({ onClose }: { onClose?: () => void }) {
  return (
    <View
      style={cardShadow}
      className="overflow-hidden rounded-3xl border border-[#CFE0E1] bg-[#EAF1F1] p-5"
    >
      {onClose ? (
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full bg-black/5 active:scale-90"
        >
          <Feather name="x" size={15} color="#5B7B82" />
        </Pressable>
      ) : null}
      <ProfileCompletionBody />
    </View>
  );
}
