import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, MapPin, Plus, RotateCcw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BalanceTile, {
  TILE_GAP,
  TILE_WIDTH,
} from '../../../src/components/leave/BalanceTile';
import RequestCard from '../../../src/components/leave/RequestCard';
import { REQUESTS } from '../../../src/components/leave/requestsData';
import { useUnreadCount } from '../../../src/components/notifications/notificationsStore';
import { cardShadow } from '../../../src/components/shadow';

// ---- Static demo data ----
const BALANCES = [
  { label: 'Annual', value: 12, accent: '#2563EB' },
  { label: 'Sick', value: 8, accent: '#059669' },
  { label: 'Casual', value: 5, accent: '#E0785C' },
  { label: 'Paternity', value: 10, accent: '#D9A53B' },
];

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
type Filter = (typeof FILTERS)[number];

export default function LeaveOverviewScreen() {
  const router = useRouter();
  const unreadCount = useUnreadCount();
  const [filter, setFilter] = useState<Filter>('All');

  const counts = useMemo(
    () => ({
      Pending: REQUESTS.filter((r) => r.status === 'Pending').length,
      Approved: REQUESTS.filter((r) => r.status === 'Approved').length,
      Rejected: REQUESTS.filter((r) => r.status === 'Rejected').length,
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
      {/* Header — mirrors the shared BackButton styling, with a trailing
          notification bell unique to the overview. */}
      <View className="flex-row items-center gap-3 px-4 pb-1 pt-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center active:scale-95"
        >
          <ChevronLeft size={24} color="#14323F" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-ink">My Leave</Text>
          <Text className="text-xs text-slate-400">
            Balances, requests & regularizations
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center active:scale-95"
        >
          <Bell size={22} color="#14323F" />
          {unreadCount > 0 ? (
            <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-canvas bg-gold" />
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Horizontally-scrolling balance tiles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TILE_WIDTH + TILE_GAP}
          decelerationRate="fast"
          contentContainerClassName="gap-3 px-4 pt-4"
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

        {/* Apply actions — label left, compact actions right, softly
            highlighted with the brand gold so the section stands out without
            breaking the page's monochrome language. */}
        <View className="mx-4 mt-4 flex-row items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Apply
          </Text>
          <View className="flex-1 flex-row justify-end gap-2">
            <Pressable
              onPress={() => router.push('/apply-leave')}
              style={cardShadow}
              className="h-12 flex-row items-center justify-center gap-1.5 rounded-xl border border-transparent bg-ink px-2.5 active:scale-[0.98] active:bg-ink/90"
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text numberOfLines={1} className="text-sm font-bold text-white">
                Leave
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/regularize')}
              style={cardShadow}
              className="h-12 flex-shrink flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 active:scale-[0.98] active:bg-slate-50"
            >
              <RotateCcw size={15} color="#14323F" strokeWidth={2.25} />
              <Text numberOfLines={1} className="text-sm font-bold text-ink">
                Regularize
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/work-from-home')}
              style={cardShadow}
              className="h-12 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 active:scale-[0.98] active:bg-slate-50"
            >
              <MapPin size={15} color="#14323F" strokeWidth={2.25} />
              <Text numberOfLines={1} className="text-sm font-bold text-ink">
                WFH/WO
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Requests header — eyebrow label matching the Balance section */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-6">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Requests
          </Text>
          <Pressable hitSlop={8} onPress={() => router.push('/requests')}>
            <Text className="text-sm font-bold text-ink">View all</Text>
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
              rejectionReason={r.rejectionReason}
              onCancel={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
