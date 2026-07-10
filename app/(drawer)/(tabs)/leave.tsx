import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, MapPin, Plus, RotateCcw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Dropdown from '../../../src/components/leave/Dropdown';
import BalanceTile from '../../../src/components/leave/BalanceTile';
import RequestCard from '../../../src/components/leave/RequestCard';
import { REQUESTS } from '../../../src/components/leave/requestsData';
import { cardShadow } from '../../../src/components/shadow';

// ---- Static demo data ----
const YEARS = ['2026', '2025', '2024'] as const;

const BALANCES = [
  { label: 'Annual', value: 12, accent: '#2563EB' },
  { label: 'Sick', value: 8, accent: '#059669' },
  { label: 'Casual', value: 5, accent: '#E0785C' },
  { label: 'Paternity', value: 10, accent: '#D9A53B' },
];

const FILTERS = ['All', 'Pending', 'Approved'] as const;
type Filter = (typeof FILTERS)[number];

export default function LeaveOverviewScreen() {
  const router = useRouter();
  const [year, setYear] = useState<string>('2026');
  const [filter, setFilter] = useState<Filter>('All');

  const counts = useMemo(
    () => ({
      Pending: REQUESTS.filter((r) => r.status === 'Pending').length,
      Approved: REQUESTS.filter((r) => r.status === 'Approved').length,
    }),
    [],
  );

  // Overview shows only the most recent few; the rest live on "View all".
  const visible = useMemo(() => {
    const matched =
      filter === 'All'
        ? REQUESTS
        : REQUESTS.filter((r) => r.status === filter);
    return matched.slice(0, 3);
  }, [filter]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white active:scale-95"
        >
          <ChevronLeft size={20} color="#14323F" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-extrabold text-ink">My Leave</Text>
          <Text className="text-xs text-slate-400">
            Balances, requests & regularizations
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white active:scale-95"
        >
          <Bell size={18} color="#14323F" />
          <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-amber-400" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Balance header */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-4">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Balance
          </Text>
          <Dropdown
            className="w-28"
            value={year}
            placeholder="2026"
            options={YEARS}
            onSelect={setYear}
          />
        </View>

        {/* Horizontally-scrolling balance tiles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 px-4"
        >
          {BALANCES.map((b) => (
            <BalanceTile
              key={b.label}
              label={b.label}
              value={b.value}
              accent={b.accent}
            />
          ))}
        </ScrollView>

        {/* Action buttons */}
        <View className="flex-row gap-2.5 px-4 pt-4">
          <Pressable
            onPress={() => router.push('/apply-leave')}
            style={cardShadow}
            className="h-12 flex-[1.3] flex-row items-center justify-center gap-1.5 rounded-xl bg-ink px-2 active:scale-[0.98] active:bg-ink/90"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text numberOfLines={1} className="text-sm font-bold text-white">
              Apply Leave
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/regularize')}
            style={cardShadow}
            className="h-12 flex-[1.3] flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 active:scale-[0.98] active:bg-slate-50"
          >
            <RotateCcw size={15} color="#14323F" strokeWidth={2.25} />
            <Text numberOfLines={1} className="text-sm font-bold text-ink">
              Regularize
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/work-from-home')}
            style={cardShadow}
            className="h-12 flex-[0.9] flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 active:scale-[0.98] active:bg-slate-50"
          >
            <MapPin size={15} color="#14323F" strokeWidth={2.25} />
            <Text numberOfLines={1} className="text-sm font-bold text-ink">
              WFH
            </Text>
          </Pressable>
        </View>

        {/* Requests header */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-6">
          <Text className="text-lg font-extrabold text-ink">Requests</Text>
          <Pressable hitSlop={8} onPress={() => router.push('/requests')}>
            <Text className="text-sm font-bold text-blue-600">View all</Text>
          </Pressable>
        </View>

        {/* Filter segmented control */}
        <View className="mx-4 flex-row rounded-2xl bg-slate-200/70 p-1.5">
          {FILTERS.map((f) => {
            const active = filter === f;
            const count = f === 'All' ? null : counts[f];
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
                  {count != null ? ` · ${count}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Request list */}
        <View className="gap-4 px-4 pt-4">
          {visible.map((r) => (
            <RequestCard
              key={r.id}
              type={r.type}
              dates={r.dates}
              days={r.days}
              status={r.status}
              icon={r.icon}
              iconColor={r.iconColor}
              badgeClass={r.badgeClass}
              onCancel={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
