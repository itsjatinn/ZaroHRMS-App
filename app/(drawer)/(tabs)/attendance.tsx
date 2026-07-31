import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../../src/components/BackButton';
import AppScrollView from '../../../src/components/AppScrollView';
import AttendanceCalendarCard from '../../../src/components/AttendanceCalendarCard';
import AttendanceStatGrid from '../../../src/components/attendance/AttendanceStatGrid';
import MonthFilter from '../../../src/components/attendance/MonthFilter';
import {
  fromDayStatuses,
  getMonthData,
  toPercent,
  toStats,
} from '../../../src/components/attendance/monthData';
import { useAuth } from '../../../src/auth/AuthContext';

export default function Attendance() {
  const insets = useSafeAreaInsets();
  const { isBackendSession } = useAuth();
  const now = new Date();

  // Single source of truth: the month drives every card on the page. A live
  // session opens on the real month; the demo keeps June 2026, the month its
  // sample data describes.
  const [{ year, month }, setMonth] = useState(
    isBackendSession
      ? { year: now.getFullYear(), month: now.getMonth() }
      : { year: 2026, month: 5 },
  );
  // Same reason as the calendar card: the initialiser runs before the session
  // has restored, so the month would otherwise stay pinned to the demo month.
  const monthSyncedRef = useRef(false);
  useEffect(() => {
    if (!isBackendSession || monthSyncedRef.current) return;
    monthSyncedRef.current = true;
    const today = new Date();
    setMonth({ year: today.getFullYear(), month: today.getMonth() });
  }, [isBackendSession]);

  // The calendar resolves the month (attendance + leave + holidays + optional
  // claims) and hands the result up, so the summary counts exactly the days
  // the grid draws instead of a second, divergent source.
  const [dayStatuses, setDayStatuses] = useState<Record<number, string>>({});

  const data = useMemo(
    () =>
      isBackendSession ? fromDayStatuses(dayStatuses) : getMonthData(year, month),
    [isBackendSession, dayStatuses, year, month],
  );
  const stats = toStats(data);
  const percent = toPercent(data);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <AppScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 112 }}
      >
        {/* Header row: back + title on the left, month filter on the right */}
        <View className="-mx-4 min-h-[58px] flex-row items-center justify-between pr-4">
          <View className="flex-1">
            <BackButton
              title="Attendance"
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
        <AttendanceCalendarCard
          year={year}
          month={month}
          hideLeaveLegend
          onMonthStatuses={setDayStatuses}
        />
      </AppScrollView>
    </SafeAreaView>
  );
}
