import { CalendarX } from 'lucide-react-native';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import {
  getMonthLog,
  STATUS_META,
  type LogStatus,
} from '../../src/components/attendance/activityLogData';
import LogRow from '../../src/components/attendance/LogRow';
import MonthFilter from '../../src/components/attendance/MonthFilter';
import { cardShadow } from '../../src/components/shadow';

type StatusFilter = 'all' | LogStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent', label: 'Absent' },
  { value: 'wfh', label: 'WFH' },
  { value: 'leave', label: 'Leave' },
];

// Compact at-a-glance tile for the summary row.
function SummaryChip({ value, label }: { value: number; label: string }) {
  return (
    <View
      style={cardShadow}
      className="flex-1 items-center rounded-2xl border border-slate-100 bg-white py-2.5"
    >
      <Text className="text-lg font-extrabold text-ink">{value}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Text>
    </View>
  );
}

// Full day-by-day attendance record — the "View All" behind the attendance
// page's Recent Activity card.
export default function AttendanceLogScreen() {
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), []);

  const [{ year, month }, setMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [status, setStatus] = useState<StatusFilter>('all');

  const entries = useMemo(() => getMonthLog(year, month), [year, month]);

  const counts = useMemo(
    () => ({
      present: entries.filter((e) => e.status === 'present').length,
      late: entries.filter((e) => e.status === 'late').length,
      absent: entries.filter((e) => e.status === 'absent').length,
      leave: entries.filter((e) => e.status === 'leave').length,
    }),
    [entries],
  );

  const visible = useMemo(
    () =>
      status === 'all'
        ? entries
        : entries.filter((e) => e.status === status),
    [entries, status],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      {/* Header: back + title left, month stepper right */}
      <View className="min-h-[58px] flex-row items-center justify-between pr-4">
        <View className="flex-1">
          <BackButton
            title="Activity Log"
            subtitle="Your day-by-day attendance record."
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

      {/* Month summary — fixed above the scrolling log */}
      <View className="flex-row gap-2 px-4 pt-2">
        <SummaryChip value={counts.present} label="Present" />
        <SummaryChip value={counts.late} label="Late" />
        <SummaryChip value={counts.absent} label="Absent" />
        <SummaryChip value={counts.leave} label="Leave" />
      </View>

      {/* Status filter */}
      <View className="mt-4 flex-row flex-wrap gap-2 px-4">
        {FILTER_OPTIONS.map((option) => {
          const active = option.value === status;
          return (
            <Pressable
              key={option.value}
              onPress={() => setStatus(option.value)}
              style={active ? undefined : cardShadow}
              className={`rounded-full border px-3.5 py-2 ${
                active
                  ? 'border-[#14323F] bg-[#14323F]'
                  : 'border-slate-200 bg-white active:scale-95'
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  active ? 'text-white' : 'text-slate-500'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Day rows */}
        <View className="px-4">
          {visible.length === 0 ? (
            <View
              style={cardShadow}
              className="items-center rounded-[22px] border border-slate-100 bg-white px-6 py-10"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <CalendarX size={22} color="#94A3B8" />
              </View>
              <Text className="mt-3 text-center text-[13px] text-slate-400">
                No {status === 'all' ? '' : `${STATUS_META[status].label.toLowerCase()} `}
                days recorded this month.
              </Text>
            </View>
          ) : (
            <View
              style={cardShadow}
              className="rounded-[22px] border border-slate-100 bg-white px-5 py-2"
            >
              {visible.map((entry, i) => (
                <Fragment key={entry.iso}>
                  {i > 0 && <View className="border-b border-slate-100" />}
                  <LogRow entry={entry} showRegularize />
                </Fragment>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
