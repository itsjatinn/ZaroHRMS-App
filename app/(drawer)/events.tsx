import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import EventMonthGrid from '../../src/components/events/EventMonthGrid';
import EventRow from '../../src/components/events/EventRow';
import {
  formatFullDate,
  MONTHS,
  sameDay,
  type CalendarEvent,
  type CalendarView,
} from '../../src/components/events/eventsData';
import HolidayDetailsSheet from '../../src/components/holidays/HolidayDetailsSheet';
import HolidayGridCard from '../../src/components/holidays/HolidayGridCard';
import {
  HOLIDAY_YEAR,
  HOLIDAYS,
  isPast,
  monthShort,
  OPTIONAL_QUOTA,
  parseDate,
  startOfToday,
  TYPE_META,
  weekdayLong,
  type CalendarHoliday,
  type HolidayType,
} from '../../src/components/holidays/holidayCalendarData';
import { cardShadow } from '../../src/components/shadow';

type TypeFilter = 'all' | HolidayType;

/** Only the views that suit all-day entries — no hourly week timeline. */
const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'month', label: 'Month' },
  { value: 'list', label: 'List' },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All holidays' },
  { value: 'national', label: 'National' },
  { value: 'state', label: 'State' },
  { value: 'optional', label: 'Optional' },
  { value: 'company', label: 'Company' },
];

/** Month and day views run on the shared event components, so holidays are
 *  projected into all-day calendar events for those two. */
function toEvent(h: CalendarHoliday): CalendarEvent {
  return {
    id: h.id,
    title: h.name,
    start: parseDate(h.date).toISOString(),
    allDay: true,
    kind: 'holiday',
    meta: TYPE_META[h.type].label,
  };
}

export default function Events() {
  const insets = useSafeAreaInsets();
  const today = useMemo(startOfToday, []);

  const [holidays, setHolidays] = useState<CalendarHoliday[]>(HOLIDAYS);
  const [view, setView] = useState<CalendarView>('grid');
  const [cursor, setCursor] = useState<Date>(startOfToday);
  const [selectedDay, setSelectedDay] = useState<Date>(startOfToday);
  const [type, setType] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CalendarHoliday | null>(null);

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

  const asEvents = useMemo(() => filtered.map(toEvent), [filtered]);

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
  const remaining = Math.max(0, OPTIONAL_QUOTA - claimed);

  // Every entry is all-day, so the navigator only ever steps a month.
  const step = (direction: -1 | 1) => {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + direction);
    setCursor(next);
  };

  const goToday = () => {
    const now = startOfToday();
    setCursor(now);
    setSelectedDay(now);
  };

  const periodLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const selectedDayHolidays = useMemo(
    () => filtered.filter((h) => sameDay(parseDate(h.date), selectedDay)),
    [filtered, selectedDay],
  );

  // List view walks the whole year, one section per month.
  const byMonth = useMemo(() => {
    const out: { key: number; label: string; items: CalendarHoliday[] }[] = [];
    for (const h of filtered) {
      const month = parseDate(h.date).getMonth();
      const last = out[out.length - 1];
      if (last && last.key === month) last.items.push(h);
      else out.push({ key: month, label: MONTHS[month], items: [h] });
    }
    return out;
  }, [filtered]);

  const openEvent = (event: CalendarEvent) => {
    const match = holidays.find((h) => h.id === event.id);
    if (match) setSelected(match);
  };

  // Mock claim — the real flow will post to /api/holidays/optional-claim.
  const claim = (holiday: CalendarHoliday) => {
    setHolidays((prev) =>
      prev.map((h) => (h.id === holiday.id ? { ...h, claim: 'pending' } : h)),
    );
    setSelected(null);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Calendar"
        subtitle={`Holiday calendar ${HOLIDAY_YEAR} · ${holidays.length} days off`}
        subtitleNumberOfLines={2}
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
            <Pressable
              key={option.value}
              onPress={() => setType(option.value)}
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
      </ScrollView>

      {/* View switcher */}
      <View className="mx-4 mt-3 flex-row rounded-2xl bg-slate-200/70 p-1.5">
        {VIEWS.map((v) => {
          const active = view === v.value;
          return (
            <Pressable
              key={v.value}
              onPress={() => setView(v.value)}
              style={active ? cardShadow : undefined}
              className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
                active ? 'bg-white' : ''
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-ink' : 'text-slate-500'
                }`}
              >
                {v.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Period navigator — grid and list span the year, so only month steps. */}
      {view === 'month' ? (
        <View className="mt-3 flex-row items-center justify-between px-4">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => step(-1)}
              hitSlop={6}
              accessibilityLabel="Previous month"
              className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-95"
            >
              <ChevronLeft size={18} color="#14323F" />
            </Pressable>
            <Text className="text-[15px] font-bold text-ink">{periodLabel}</Text>
            <Pressable
              onPress={() => step(1)}
              hitSlop={6}
              accessibilityLabel="Next month"
              className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-95"
            >
              <ChevronRight size={18} color="#14323F" />
            </Pressable>
          </View>
          <Pressable
            onPress={goToday}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 active:scale-95"
          >
            <Text className="text-[13px] font-semibold text-ink">Today</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === 'grid' ? (
          filtered.length === 0 ? (
            <EmptyState label="No holidays match this filter." />
          ) : (
            <View>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {HOLIDAY_YEAR} calendar · {filtered.length}{' '}
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
                    onPress={setSelected}
                  />
                ))}
                {/* Keeps a lone last card left-aligned instead of stretched. */}
                {filtered.length % 2 === 1 ? (
                  <View className="w-[48.5%]" />
                ) : null}
              </View>
            </View>
          )
        ) : null}

        {view === 'month' ? (
          <>
            <EventMonthGrid
              cursor={cursor}
              events={asEvents}
              today={today}
              selected={selectedDay}
              onSelectDay={setSelectedDay}
            />

            {/* The grid only has room for dots, so the tapped day expands here. */}
            <View>
              <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {sameDay(selectedDay, today)
                  ? 'Today'
                  : formatFullDate(selectedDay.toISOString())}
              </Text>
              {selectedDayHolidays.length === 0 ? (
                <EmptyState label="No holiday on this day." />
              ) : (
                <View className="gap-3">
                  {selectedDayHolidays.map((h) => (
                    <EventRow
                      key={h.id}
                      event={toEvent(h)}
                      onPress={openEvent}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}

        {view === 'list' ? (
          byMonth.length === 0 ? (
            <EmptyState label="No holidays match this filter." />
          ) : (
            <View className="gap-5">
              {byMonth.map((group) => (
                <View key={group.key}>
                  <View className="mb-2.5 flex-row items-center gap-2">
                    <View className="h-1.5 w-1.5 rounded-full bg-[#F5D14E]" />
                    <Text className="text-[13px] font-bold text-ink">
                      {group.label}
                    </Text>
                    <Text className="text-[11px] text-slate-400">
                      · {group.items.length}{' '}
                      {group.items.length === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                  <View className="gap-3">
                    {group.items.map((h) => (
                      <EventRow
                        key={h.id}
                        event={toEvent(h)}
                        onPress={openEvent}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )
        ) : null}

        {/* Legend */}
        <View
          style={cardShadow}
          className="rounded-[24px] border border-slate-100 bg-white p-4"
        >
          <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Legend
          </Text>
          <View className="gap-2.5">
            <LegendRow
              type="state"
              hint="Gazetted state holiday — office closed"
            />
            <LegendRow
              type="optional"
              hint={`Claim any ${OPTIONAL_QUOTA} as paid leave`}
            />
            <LegendRow type="company" hint="Company-wide day off" />
          </View>
        </View>
      </ScrollView>

      <HolidayDetailsSheet
        holiday={selected}
        remaining={remaining}
        onClaim={claim}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View
      style={cardShadow}
      className="items-center rounded-[24px] border border-slate-100 bg-white px-6 py-8"
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <CalendarDays size={22} color="#94A3B8" />
      </View>
      <Text className="mt-3 text-center text-xs text-slate-400">{label}</Text>
    </View>
  );
}

function LegendRow({ type, hint }: { type: HolidayType; hint: string }) {
  const meta = TYPE_META[type];
  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className="rounded-full px-2 py-1"
        style={{ backgroundColor: meta.bg }}
      >
        <Text
          className="text-[10px] font-semibold"
          style={{ color: meta.color }}
        >
          {meta.label}
        </Text>
      </View>
      <Text className="flex-1 text-xs text-slate-500">{hint}</Text>
    </View>
  );
}
