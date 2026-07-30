import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  toCalendarHolidays,
  useHolidayCalendar,
  useOptionalHolidayClaim,
  useOptionalHolidayContext,
} from '../../src/api/holidays';
import { useAuth } from '../../src/auth/AuthContext';
import BackButton from '../../src/components/BackButton';
import CancelClaimDialog from '../../src/components/holidays/CancelClaimDialog';
import ClaimActionButton from '../../src/components/holidays/ClaimActionButton';
import HolidayMonthCalendar from '../../src/components/holidays/HolidayMonthCalendar';
import HolidayMonthGroup from '../../src/components/holidays/HolidayMonthGroup';
import {
  accentColor,
  claimActionFor,
  claimStatusHint,
  HOLIDAYS,
  MONTHS,
  OPTIONAL_AUTO_APPROVE,
  OPTIONAL_QUOTA,
  parseDate,
  startOfToday,
  TYPE_META,
  WEEK_OFF_COLOR,
  weekdayLong,
  type CalendarHoliday,
  type ClaimAction,
  type HolidayType,
} from '../../src/components/holidays/holidayCalendarData';
import { cardShadow } from '../../src/components/shadow';

type ViewMode = 'calendar' | 'list';

const VIEWS: { value: ViewMode; label: string; icon: typeof CalendarDays }[] = [
  { value: 'calendar', label: 'Calendar', icon: CalendarDays },
  { value: 'list', label: 'List', icon: List },
];

const LEGEND: { color: string; label: string }[] = [
  ...(['national', 'state', 'company', 'optional'] as HolidayType[]).map(
    (type) => ({ color: TYPE_META[type].color, label: TYPE_META[type].label }),
  ),
  { color: WEEK_OFF_COLOR, label: 'Week Off' },
];

// Holiday Calendar — the web panel's sidebar → Holiday screen, ported to the
// phone: month grid + grouped year list, with optional-holiday claims on both.
export default function Holidays() {
  const insets = useSafeAreaInsets();
  const today = useMemo(startOfToday, []);

  const { isBackendSession } = useAuth();
  // Offline/demo sessions keep the sample calendar so the screen stays usable.
  const [mockHolidays, setMockHolidays] = useState<CalendarHoliday[]>(HOLIDAYS);
  const [view, setView] = useState<ViewMode>('calendar');
  const [calendar, setCalendar] = useState(() => ({
    monthIndex: today.getMonth(),
    year: today.getFullYear(),
  }));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedPastMonths, setExpandedPastMonths] = useState<Set<string>>(
    () => new Set(),
  );
  const [cancelTarget, setCancelTarget] = useState<CalendarHoliday | null>(null);

  const { monthIndex, year } = calendar;

  // --- Backend data (GET /api/requests/calendar + optional-holidays). ---
  const calendarQuery = useHolidayCalendar(year, isBackendSession);
  const contextQuery = useOptionalHolidayContext(isBackendSession);
  const claimMutation = useOptionalHolidayClaim();

  const liveHolidays = useMemo(() => {
    if (!isBackendSession || !calendarQuery.data) return null;
    return toCalendarHolidays(
      calendarQuery.data.holidays ?? [],
      contextQuery.data ?? null,
    );
  }, [isBackendSession, calendarQuery.data, contextQuery.data]);

  const isLive = liveHolidays != null;
  const holidays = liveHolidays ?? mockHolidays;
  const syncing =
    isBackendSession && (calendarQuery.isPending || contextQuery.isPending);
  const syncError =
    isBackendSession && calendarQuery.isError
      ? 'Holiday data could not be refreshed.'
      : claimMutation.error
        ? claimMutation.error.message
        : null;

  const quota = contextQuery.data?.quota ?? OPTIONAL_QUOTA;
  const autoApprove = contextQuery.data?.autoApprove ?? OPTIONAL_AUTO_APPROVE;

  const localClaimed = useMemo(
    () =>
      holidays.filter(
        (h) =>
          h.type === 'optional' &&
          (h.claim === 'approved' || h.claim === 'pending'),
      ).length,
    [holidays],
  );
  const claimed = isLive ? (contextQuery.data?.used ?? localClaimed) : localClaimed;
  const remaining = isLive
    ? (contextQuery.data?.remaining ?? Math.max(0, quota - claimed))
    : Math.max(0, quota - claimed);

  /** Holidays of the year on screen, in date order. */
  const parsed = useMemo(
    () =>
      holidays
        .map((h) => ({ holiday: h, date: parseDate(h.date) }))
        .filter((entry) => entry.date.getFullYear() === year)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [holidays, year],
  );

  const holidaysByDay = useMemo(() => {
    const map = new Map<number, CalendarHoliday>();
    parsed.forEach(({ holiday, date }) => {
      if (date.getMonth() === monthIndex) map.set(date.getDate(), holiday);
    });
    return map;
  }, [parsed, monthIndex]);

  const byMonth = useMemo(() => {
    const groups = new Map<number, CalendarHoliday[]>();
    parsed.forEach(({ holiday, date }) => {
      const month = date.getMonth();
      const list = groups.get(month);
      if (list) list.push(holiday);
      else groups.set(month, [holiday]);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [parsed]);

  const selectedHoliday = selectedDay ? holidaysByDay.get(selectedDay) : null;

  const stepMonth = (direction: -1 | 1) => {
    setSelectedDay(null);
    setCalendar((current) => {
      const next = current.monthIndex + direction;
      if (next < 0) return { monthIndex: 11, year: current.year - 1 };
      if (next > 11) return { monthIndex: 0, year: current.year + 1 };
      return { monthIndex: next, year: current.year };
    });
  };

  const stepYear = (direction: -1 | 1) => {
    setSelectedDay(null);
    setCalendar((current) => ({ ...current, year: current.year + direction }));
  };

  /** Demo-session stand-in for the claim endpoints. */
  const setMockClaim = (
    holiday: CalendarHoliday,
    claim: CalendarHoliday['claim'],
  ) =>
    setMockHolidays((prev) =>
      prev.map((h) => (h.id === holiday.id ? { ...h, claim } : h)),
    );

  /** Claim, or withdraw/cancel an existing claim, then refetch the calendar. */
  const runClaim = (holiday: CalendarHoliday, action: ClaimAction) => {
    if (isLive) {
      claimMutation.mutate({
        holidayId: holiday.id,
        claimId: action === 'claim' ? null : holiday.claimId,
      });
      return;
    }
    setMockClaim(
      holiday,
      action === 'claim' ? (autoApprove ? 'approved' : 'pending') : 'open',
    );
  };

  const onClaimAction = (holiday: CalendarHoliday, action: ClaimAction) => {
    // Giving up an approved leave day asks first.
    if (action === 'cancel') {
      setCancelTarget(holiday);
      return;
    }
    runClaim(holiday, action);
  };

  const confirmCancel = (holiday: CalendarHoliday) => {
    runClaim(holiday, 'cancel');
    setCancelTarget(null);
    setSelectedDay(null);
  };

  const togglePastMonth = (key: string) =>
    setExpandedPastMonths((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Holiday Calendar"
        subtitle={
          view === 'calendar'
            ? 'Holidays for the selected month.'
            : `All holidays in ${year}.`
        }
      />

      {/* Year nav (list view) + view toggle */}
      <View className="flex-row items-center gap-2.5 px-4 pt-1">
        {view === 'list' ? (
          <View className="h-[38px] flex-row items-center rounded-xl border border-slate-200 bg-white">
            <Pressable
              onPress={() => stepYear(-1)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Previous year"
              className="h-full w-9 items-center justify-center rounded-l-xl active:bg-slate-100"
            >
              <ChevronLeft size={16} color="#14323F" />
            </Pressable>
            <Text className="min-w-[46px] text-center text-[13px] font-bold text-ink">
              {year}
            </Text>
            <Pressable
              onPress={() => stepYear(1)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Next year"
              className="h-full w-9 items-center justify-center rounded-r-xl active:bg-slate-100"
            >
              <ChevronRight size={16} color="#14323F" />
            </Pressable>
          </View>
        ) : null}

        <View className="h-[38px] flex-1 flex-row rounded-xl border border-slate-200 bg-[#F4F6F9] p-[3px]">
          {VIEWS.map((option) => {
            const active = view === option.value;
            const Icon = option.icon;
            return (
              <Pressable
                key={option.value}
                onPress={() => setView(option.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={active ? cardShadow : undefined}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-[9px] ${
                  active ? 'bg-white' : ''
                }`}
              >
                <Icon size={14} color={active ? '#14323F' : '#14323F9E'} />
                <Text
                  className={`text-[13px] font-semibold ${
                    active ? 'text-ink' : 'text-[#14323F]/60'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sync state — matches the web's inline holiday-sync messaging. */}
        {syncing ? (
          <View className="flex-row items-center justify-center gap-2 py-1">
            <ActivityIndicator size="small" color="#94A3B8" />
            <Text className="text-[12px] text-slate-400">Syncing holidays…</Text>
          </View>
        ) : null}
        {syncError ? (
          <Text className="text-[12px] font-semibold text-[#B04A2A]">
            {syncError}
          </Text>
        ) : null}

        {view === 'calendar' ? (
          <>
            <HolidayMonthCalendar
              monthIndex={monthIndex}
              year={year}
              today={today}
              holidaysByDay={holidaysByDay}
              selectedDay={selectedDay}
              onPrevMonth={() => stepMonth(-1)}
              onNextMonth={() => stepMonth(1)}
              onSelectDay={setSelectedDay}
            />

            {/* The tapped day expands here — the phone stand-in for the web's
                per-cell popover. */}
            {selectedHoliday ? (
              <View
                style={cardShadow}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-[14px] font-bold text-ink">
                      {selectedHoliday.name}
                    </Text>
                    <Text
                      className="mt-0.5 text-[11px] font-bold"
                      style={{ color: accentColor(selectedHoliday) }}
                    >
                      {selectedHoliday.claim === 'approved'
                        ? 'Approved leave'
                        : selectedHoliday.claim === 'pending'
                          ? 'Approval pending'
                          : `${TYPE_META[selectedHoliday.type].label} holiday`}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-slate-400">
                    {weekdayLong(selectedHoliday.date)}
                  </Text>
                </View>

                <Text className="mt-2 text-[12px] leading-[17px] text-[#14323F]/60">
                  {selectedHoliday.type === 'optional'
                    ? claimStatusHint(selectedHoliday, today)
                    : 'Office closed — no leave request needed.'}
                </Text>

                {(() => {
                  const spec = claimActionFor(selectedHoliday, remaining, today);
                  if (!spec) return null;
                  return (
                    <View className="mt-3">
                      <ClaimActionButton
                        spec={spec}
                        block
                        onPress={() =>
                          spec.action &&
                          onClaimAction(selectedHoliday, spec.action)
                        }
                      />
                    </View>
                  );
                })()}
              </View>
            ) : null}

            {/* Legend */}
            <View
              style={cardShadow}
              className="flex-row flex-wrap gap-x-4 gap-y-2.5 rounded-2xl border border-slate-100 bg-white p-4"
            >
              {LEGEND.map((item) => (
                <View
                  key={item.label}
                  className="flex-row items-center gap-1.5"
                >
                  <View
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text className="text-[12px] text-slate-600">
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Optional holiday allowance */}
            <View
              style={cardShadow}
              className="flex-row items-center justify-between gap-3 rounded-2xl border border-[#14323F]/10 bg-white px-4 py-3.5"
            >
              <View className="min-w-0 flex-1">
                <Text className="text-[13px] font-bold text-ink">
                  Optional holiday allowance
                </Text>
                <Text className="mt-0.5 text-[11.5px] leading-4 text-[#14323F]/58">
                  {autoApprove
                    ? 'Claims apply instantly.'
                    : 'Claims are sent to your reporting manager or HR for approval.'}
                </Text>
              </View>
              <View className="rounded-full bg-[#7C5CC6]/15 px-2.5 py-1">
                <Text className="text-[11px] font-bold text-[#7C5CC6]">
                  {claimed} of {quota} claimed
                </Text>
              </View>
            </View>

            {byMonth.length === 0 ? (
              <View
                style={cardShadow}
                className="items-center rounded-2xl border border-slate-100 bg-white px-6 py-10"
              >
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <CalendarDays size={22} color="#94A3B8" />
                </View>
                <Text className="mt-3 text-center text-[13px] text-slate-400">
                  No holidays in {year}.
                </Text>
              </View>
            ) : (
              byMonth.map(([month, items]) => {
                const key = `${year}-${month}`;
                const isCurrentMonth =
                  year === today.getFullYear() && month === today.getMonth();
                const isPastMonth =
                  year < today.getFullYear() ||
                  (year === today.getFullYear() && month < today.getMonth());

                return (
                  <HolidayMonthGroup
                    key={key}
                    label={MONTHS[month]}
                    status={
                      isPastMonth
                        ? 'Completed'
                        : isCurrentMonth
                          ? 'Current month'
                          : 'Upcoming'
                    }
                    items={items}
                    collapsible={isPastMonth}
                    collapsed={isPastMonth && !expandedPastMonths.has(key)}
                    onToggle={() => togglePastMonth(key)}
                    today={today}
                    remaining={remaining}
                    busy={claimMutation.isPending}
                    onClaimAction={onClaimAction}
                  />
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <CancelClaimDialog
        holiday={cancelTarget}
        onKeep={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
    </SafeAreaView>
  );
}
