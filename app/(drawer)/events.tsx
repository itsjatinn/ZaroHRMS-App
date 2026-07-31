import { CalendarDays, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert } from '../../src/components/CrossAlert';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import {
  toCalendarHolidays,
  useHolidayCalendar,
  useOptionalHolidayClaim,
  useOptionalHolidayContext,
} from '../../src/api/holidays';
import { useAuth } from '../../src/auth/AuthContext';
import CancelClaimDialog from '../../src/components/holidays/CancelClaimDialog';
import HolidayDetailsSheet from '../../src/components/holidays/HolidayDetailsSheet';
import HolidayGridCard from '../../src/components/holidays/HolidayGridCard';
import {
  HOLIDAY_YEAR,
  HOLIDAYS,
  isPast,
  monthShort,
  OPTIONAL_QUOTA,
  startOfToday,
  weekdayLong,
  type CalendarHoliday,
  type HolidayType,
} from '../../src/components/holidays/holidayCalendarData';
import { cardShadow } from '../../src/components/shadow';

type TypeFilter = 'all' | HolidayType;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All holidays' },
  { value: 'national', label: 'National' },
  { value: 'state', label: 'State' },
  { value: 'optional', label: 'Optional' },
  { value: 'company', label: 'Company' },
];

export default function Events() {
  const insets = useSafeAreaInsets();
  const today = useMemo(startOfToday, []);

  const { isBackendSession } = useAuth();
  const calendarYear = isBackendSession ? new Date().getFullYear() : HOLIDAY_YEAR;

  // Live calendar + this employee's optional-holiday claims, merged the same
  // way the web page does (claims matched on date + name). The offline demo
  // session keeps the sample list and claims locally.
  const calendarQuery = useHolidayCalendar(calendarYear, isBackendSession);
  const claimContextQuery = useOptionalHolidayContext(isBackendSession);
  const claimMutation = useOptionalHolidayClaim();

  const [demoHolidays, setDemoHolidays] = useState<CalendarHoliday[]>(HOLIDAYS);
  const holidays = useMemo(
    () =>
      isBackendSession
        ? toCalendarHolidays(
            calendarQuery.data?.holidays ?? [],
            claimContextQuery.data ?? null,
          )
        : demoHolidays,
    [isBackendSession, calendarQuery.data, claimContextQuery.data, demoHolidays],
  );
  const [type, setType] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CalendarHoliday | null>(null);
  /** Approved claim awaiting cancel confirmation. */
  const [cancelTarget, setCancelTarget] = useState<CalendarHoliday | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return holidays.filter((h) => {
      if (type !== 'all' && h.type !== type) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        weekdayLong(h.date).toLowerCase().includes(q) ||
        monthShort(h.date).toLowerCase().includes(q)
      );
    });
  }, [holidays, query, type]);

  const upcomingCount = useMemo(
    () => filtered.filter((h) => !isPast(h.date, today)).length,
    [filtered, today],
  );

  const claimed = useMemo(
    () =>
      holidays.filter(
        (h) =>
          h.type === 'optional' &&
          (h.claim === 'approved' || h.claim === 'pending'),
      ).length,
    [holidays],
  );
  // The server's quota context is authoritative on a live session; the demo
  // derives the same number from its local claims.
  const remaining = isBackendSession
    ? Math.max(0, claimContextQuery.data?.remaining ?? 0)
    : Math.max(0, OPTIONAL_QUOTA - claimed);

  // Claims post to the same endpoint the web uses; auto-approve orgs come back
  // approved on the refetch, others as pending. Demo claims stay local.
  const claim = (holiday: CalendarHoliday) => {
    setSelected(null);
    if (!isBackendSession) {
      setDemoHolidays((prev) =>
        prev.map((h) => (h.id === holiday.id ? { ...h, claim: 'pending' } : h)),
      );
      return;
    }
    claimMutation.mutate(
      { holidayId: holiday.id, claimId: null },
      {
        onError: (error) => {
          Alert.alert(
            'Could not claim this holiday',
            error instanceof Error && error.message
              ? error.message
              : 'Please try again in a moment.',
          );
        },
      },
    );
  };

  /** Shared by both paths — posts the cancel, or unwinds the demo claim. */
  const performCancel = (holiday: CalendarHoliday) => {
    if (!isBackendSession) {
      setDemoHolidays((prev) =>
        prev.map((h) => (h.id === holiday.id ? { ...h, claim: 'open' } : h)),
      );
      return;
    }
    if (!holiday.claimId) {
      Alert.alert(
        'Could not cancel',
        'This claim has not synced yet. Pull to refresh and try again.',
      );
      return;
    }
    claimMutation.mutate(
      { holidayId: holiday.id, claimId: holiday.claimId },
      {
        onError: (error) => {
          Alert.alert(
            'Could not cancel this claim',
            error instanceof Error && error.message
              ? error.message
              : 'Please try again in a moment.',
          );
        },
      },
    );
  };

  // From the details sheet. A pending claim withdraws quietly; cancelling an
  // approved one takes a day off the attendance calendar, so it confirms
  // first — same order of ceremony as the web.
  const requestCancelClaim = (holiday: CalendarHoliday) => {
    setSelected(null);
    if (holiday.claim === 'approved') {
      setCancelTarget(holiday);
      return;
    }
    performCancel(holiday);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Holidays"
        subtitle="Company holiday calendar"
      />

      {/* Search */}
      <View className="px-4 pt-2">
        <View
          style={cardShadow}
          className="h-12 flex-row items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5"
        >
          <Search size={17} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search holidays…"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-sm text-ink"
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <X size={16} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 grow-0"
        contentContainerClassName="gap-2 px-4"
      >
        {TYPE_OPTIONS.map((option) => {
          const active = option.value === type;
          return (
            // Matches the Celebrations chips exactly. The elevation that
            // cardShadow adds was sitting on every inactive chip and swallowing
            // the tap, so the filter never changed; colours move to inline
            // styles for the same reason that page does it.
            <Pressable
              key={option.value}
              onPress={() => setType(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className="h-8 items-center justify-center rounded-full border px-3.5"
              style={{
                backgroundColor: active ? '#14323F' : '#FFFFFF',
                borderColor: active ? '#14323F' : 'rgba(13, 55, 73, 0.15)',
              }}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{ color: active ? '#FFFFFF' : 'rgba(13, 55, 73, 0.65)' }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <EmptyState label="No holidays match this filter." />
        ) : (
          <View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {calendarYear} calendar · {filtered.length}{' '}
                {filtered.length === 1 ? 'day' : 'days'}
              </Text>
              <Text className="text-[11px] text-slate-400">
                {upcomingCount} upcoming
              </Text>
            </View>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {filtered.map((h) => (
                <HolidayGridCard
                  key={h.id}
                  holiday={h}
                  past={isPast(h.date, today)}
                  // Only optional holidays are claimable, so only they open the
                  // details sheet; fixed office-closures are non-interactive.
                  onPress={h.type === 'optional' ? setSelected : undefined}
                />
              ))}
              {/* Keeps a lone last card left-aligned instead of stretched. */}
              {filtered.length % 2 === 1 ? (
                <View className="w-[48.5%]" />
              ) : null}
            </View>
          </View>
        )}

      </ScrollView>

      <CancelClaimDialog
        holiday={cancelTarget}
        onKeep={() => setCancelTarget(null)}
        onConfirm={(holiday) => {
          setCancelTarget(null);
          performCancel(holiday);
        }}
      />

      <HolidayDetailsSheet
        holiday={selected}
        remaining={remaining}
        onClaim={claim}
        onCancelClaim={requestCancelClaim}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View
      style={cardShadow}
      className="items-center rounded-[22px] border border-slate-100 bg-white px-6 py-8"
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <CalendarDays size={22} color="#94A3B8" />
      </View>
      <Text className="mt-3 text-center text-xs text-slate-400">{label}</Text>
    </View>
  );
}
