import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { ProfileCompletionItem } from '../api/profile';
import { cardShadow } from './shadow';

const PROGRESS = '#14323F'; // ink teal (brand primary)
const TRACK = '#D2E0E1';

// Ring sizing
const SIZE = 76;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function ProgressRing({ percent }: { percent: number }) {
  const arc = (Math.max(0, Math.min(100, percent)) / 100) * C;

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
      <Text className="text-lg font-bold text-ink">{percent}%</Text>
    </View>
  );
}

export type ProfileCompletionProps = {
  percent: number;
  /** Sections still to fill, in the order the backend returned them. */
  missing: ProfileCompletionItem[];
};

/**
 * The body of the profile-completion card: ring + heading + CTA. Shared by the
 * home-screen card and the first-load popup so they look identical.
 *
 * Naming the sections that are actually missing (rather than a generic "finish
 * setting up") is what makes the card actionable — the employee can see
 * whether they are one bank account away from done or have not started.
 */
export function ProfileCompletionBody({ percent, missing }: ProfileCompletionProps) {
  const router = useRouter();
  const left = missing.length;

  return (
    <View className="flex-row items-center">
      <ProgressRing percent={percent} />

      <View className="ml-4 flex-1">
        <Text className="text-[17px] font-bold text-ink">
          Complete your profile
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-[#5B7B82]">
          {left === 0
            ? 'Finish setting up to help your team reach you.'
            : `${left} item${left === 1 ? '' : 's'} left · ${missing
                .slice(0, 2)
                .map((m) => m.label)
                .join(', ')}${left > 2 ? '…' : ''}`}
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

export default function ProfileCompletionCard({
  percent,
  missing,
  onClose,
}: ProfileCompletionProps & { onClose?: () => void }) {
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
      <ProfileCompletionBody percent={percent} missing={missing} />
    </View>
  );
}
