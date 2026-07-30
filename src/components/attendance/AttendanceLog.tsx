import { useRouter } from 'expo-router';
import { Fragment, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { getRecentLog } from './activityLogData';
import LogRow from './LogRow';

// The attendance page's "Recent Activity" card: the last few working days,
// with View All opening the full month-by-month log.
export default function AttendanceLog() {
  const router = useRouter();
  const recent = useMemo(() => getRecentLog(5), []);

  return (
    <View
      style={cardShadow}
      className="rounded-[22px] border border-slate-100 bg-white p-5"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">Recent Activity</Text>
        <Pressable
          hitSlop={6}
          onPress={() => router.push('/attendance-log')}
          accessibilityRole="button"
          className="active:opacity-60"
        >
          <Text className="text-xs font-bold text-ink">View All</Text>
        </Pressable>
      </View>

      {/* Log rows */}
      <View className="mt-2">
        {recent.map((entry, i) => (
          <Fragment key={entry.iso}>
            {i > 0 && <View className="border-b border-slate-100" />}
            <LogRow entry={entry} />
          </Fragment>
        ))}
      </View>
    </View>
  );
}
