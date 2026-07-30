import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../../src/components/BackButton';
import AttendanceCalendarCard from '../../../src/components/AttendanceCalendarCard';
import AttendanceStatGrid from '../../../src/components/attendance/AttendanceStatGrid';
import MonthFilter from '../../../src/components/attendance/MonthFilter';
import {
  getMonthData,
  toPercent,
  toStats,
} from '../../../src/components/attendance/monthData';

export default function Attendance() {
  const insets = useSafeAreaInsets();

  // Single source of truth: the month drives every card on the page.
  const [{ year, month }, setMonth] = useState({ year: 2026, month: 5 });

  const data = getMonthData(year, month);
  const stats = toStats(data);
  const percent = toPercent(data);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 112 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row: back + title on the left, month filter on the right */}
        <View className="-mx-4 min-h-[58px] flex-row items-center justify-between pr-4">
          <View className="flex-1">
            <BackButton
              title="Attendance"
              subtitle="Track your daily attendance and work hours."
              subtitleNumberOfLines={2}
            />
          </View>
          <View className="justify-center">
            <MonthFilter
              year={year}
              month={month}
              onChange={(y, m) => setMonth({ year: y, month: m })}
            />
          </View>
        </View>

        {/* Summary: 2×2 grid with a center % ring */}
        <AttendanceStatGrid stats={stats} percent={percent} />

        {/* Monthly attendance calendar */}
        <AttendanceCalendarCard year={year} month={month} />
      </ScrollView>
    </SafeAreaView>
  );
}
