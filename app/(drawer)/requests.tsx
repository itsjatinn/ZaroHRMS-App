import { useRouter } from 'expo-router';
import { CalendarX, ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Dropdown from '../../src/components/leave/Dropdown';
import RequestCard from '../../src/components/leave/RequestCard';
import { REQUESTS, type Request } from '../../src/components/leave/requestsData';
import { cardShadow } from '../../src/components/shadow';

const YEARS = ['2026', '2025', '2024'] as const;

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
type Filter = (typeof FILTERS)[number];

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

export default function AllRequestsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('All');
  const [year, setYear] = useState<string>('2026');

  const counts = useMemo(
    () => ({
      All: REQUESTS.length,
      Pending: REQUESTS.filter((r) => r.status === 'Pending').length,
      Approved: REQUESTS.filter((r) => r.status === 'Approved').length,
      Rejected: REQUESTS.filter((r) => r.status === 'Rejected').length,
    }),
    [],
  );

  const visible = useMemo(
    () =>
      filter === 'All'
        ? REQUESTS
        : REQUESTS.filter((r) => r.status === filter),
    [filter],
  );

  // Consecutive requests sharing a month collapse under one section header
  // (the feed is already ordered newest-first).
  const grouped = useMemo(() => {
    const sections: { month: string; items: Request[] }[] = [];
    for (const r of visible) {
      const last = sections[sections.length - 1];
      if (last && last.month === r.month) last.items.push(r);
      else sections.push({ month: r.month, items: [r] });
    }
    return sections;
  }, [visible]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <View className="z-10 flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center active:scale-95"
        >
          <ChevronLeft size={24} color="#14323F" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-ink" numberOfLines={1}>
            Leave Requests
          </Text>
          <Text className="text-xs text-slate-400" numberOfLines={1}>
            {counts.All} total · {counts.Pending} pending
          </Text>
        </View>
        <Dropdown
          className="w-28"
          value={year}
          placeholder="2026"
          options={YEARS}
          onSelect={setYear}
        />
      </View>

      {/* At-a-glance counts */}
      <View className="flex-row gap-2 px-4">
        <SummaryChip value={counts.All} label="Total" />
        <SummaryChip value={counts.Pending} label="Pending" />
        <SummaryChip value={counts.Approved} label="Approved" />
        <SummaryChip value={counts.Rejected} label="Rejected" />
      </View>

      {/* Filter segmented control */}
      <View className="mx-4 mt-4 flex-row rounded-2xl bg-slate-200/70 p-1.5">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
                active ? 'bg-white' : ''
              }`}
              style={active ? cardShadow : undefined}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-ink' : 'text-slate-500'
                }`}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-32 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {grouped.length > 0 ? (
          grouped.map((section, i) => (
            <View key={section.month} className={i === 0 ? '' : 'mt-5'}>
              <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.month}
              </Text>
              <View className="gap-4">
                {section.items.map((r) => (
                  <RequestCard
                    key={r.id}
                    type={r.type}
                    dates={r.dates}
                    days={r.days}
                    status={r.status}
                    icon={r.icon}
                    rejectionReason={r.rejectionReason}
                    onCancel={r.status !== 'Rejected' ? () => {} : undefined}
                  />
                ))}
              </View>
            </View>
          ))
        ) : (
          <View className="mt-24 items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <CalendarX size={26} color="#94A3B8" />
            </View>
            <Text className="text-base font-bold text-ink">
              No {filter.toLowerCase()} requests
            </Text>
            <Text className="px-10 text-center text-sm text-slate-400">
              You have no {filter.toLowerCase()} leave requests right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
