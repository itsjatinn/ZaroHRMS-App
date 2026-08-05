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
  const [calendarLoading, setCalendarLoading] = useState(false);

  const data = useMemo(
    () => {
      if (isBackendSession && calendarLoading) {
        return { present: 0, absent: 0, late: 0, leave: 0, working: 0 };
      }
      return isBackendSession
        ? fromDayStatuses(dayStatuses)
        : getMonthData(year, month);
    },
    [isBackendSession, calendarLoading, dayStatuses, year, month],
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
        {/* Header row: back + title. The month is chosen on the calendar card
            below, with the same arrows the home screen uses. */}
        <View className="-mx-4 min-h-[58px] justify-center">
          <BackButton title="Attendance" />
        </View>

        {/* Summary: 2×2 grid with a center % ring */}
        <AttendanceStatGrid
          stats={stats}
          percent={percent}
          loading={isBackendSession && calendarLoading}
        />

        {/* Monthly attendance calendar. Still controlled — the stat grid above
            has to summarise the same month — but its own arrows drive the
            change now, exactly as on the home screen. */}
        <AttendanceCalendarCard
          year={year}
          month={month}
          hideLeaveLegend
          onMonthStatuses={setDayStatuses}
          onMonthLoadingChange={setCalendarLoading}
          onMonthChange={(y, m) => setMonth({ year: y, month: m })}
        />
      </AppScrollView>
    </SafeAreaView>
  );
}
