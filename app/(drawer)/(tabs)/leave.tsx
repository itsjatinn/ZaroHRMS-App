import { useRouter } from 'expo-router';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useApplicableLeaveTypes,
  useCancelMyRequest,
  useMyRequests,
} from '../../../src/api/leave';
import { useAuth } from '../../../src/auth/AuthContext';
import AppScrollView from '../../../src/components/AppScrollView';
import FilterSheet, { FilterIconButton } from '../../../src/components/FilterSheet';
import PageLoading from '../../../src/components/PageLoading';
import BalanceTile, {
  TILE_GAP,
  TILE_WIDTH,
} from '../../../src/components/leave/BalanceTile';
import CancelLeaveDialog from '../../../src/components/leave/CancelLeaveDialog';
import RequestCard from '../../../src/components/leave/RequestCard';
import type { Request } from '../../../src/components/leave/requestsData';
import { REQUESTS, toRequest } from '../../../src/components/leave/requestsData';
import { useUnreadCount } from '../../../src/components/notifications/notificationsStore';
import { cardShadow } from '../../../src/components/shadow';

// ---- Static demo data ----
const BALANCES = [
  { label: 'Annual', value: 12, accent: '#2563EB' },
  { label: 'Sick', value: 8, accent: '#059669' },
  { label: 'Casual', value: 5, accent: '#E0785C' },
  { label: 'Paternity', value: 10, accent: '#D9A53B' },
];

// Mirrors the view-all page. Cancelled and withdrawn requests were previously
// unreachable from either screen.
/** Accents assigned by position — same rotation as the Apply Leave tiles. */
const TILE_ACCENTS = [
  '#E07856',
  '#5E9B7B',
  '#D4A24A',
  '#7C7BD8',
  '#2F6D7F',
  '#B96A00',
];

const FILTERS = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
  'Cancellation requested',
  'Cancelled',
  'Cancellation rejected',
] as const;
type Filter = (typeof FILTERS)[number];

export default function LeaveOverviewScreen() {
  const router = useRouter();
  const unreadCount = useUnreadCount();
  const { isBackendSession } = useAuth();
  const [filter, setFilter] = useState<Filter>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const cancelRequest = useCancelMyRequest();
  const [cancelTarget, setCancelTarget] = useState<Request | null>(null);

  // Live balances (tenant types, gender-filtered) and the real request feed;
  // the demo session keeps its samples.
  const applicable = useApplicableLeaveTypes(isBackendSession);
  const requestsQuery = useMyRequests(isBackendSession);

  const balances = useMemo(
    () =>
      isBackendSession
        ? applicable.types.map((type, index) => ({
            label: type.short,
            value: type.remaining,
            accent: TILE_ACCENTS[index % TILE_ACCENTS.length],
          }))
        : BALANCES,
    [isBackendSession, applicable.types],
  );

  const requests = useMemo(
    () =>
      isBackendSession
        ? (requestsQuery.data ?? []).map(toRequest)
        : REQUESTS,
    [isBackendSession, requestsQuery.data],
  );

  const counts = useMemo(
    () => ({
      Pending: requests.filter((r) => r.status === 'Pending').length,
      Approved: requests.filter((r) => r.status === 'Approved').length,
      Rejected: requests.filter((r) => r.status === 'Rejected').length,
      Cancelled: requests.filter((r) => r.status === 'Cancelled').length,
      'Cancellation requested': requests.filter(
        (r) => r.status === 'Cancellation requested',
      ).length,
      'Cancellation rejected': requests.filter(
        (r) => r.status === 'Cancellation rejected',
      ).length,
    }),
    [requests],
  );

  // Overview shows only the most recent few; the rest live on "View all".
  const visible = useMemo(() => {
    const matched =
      filter === 'All'
        ? requests
        : requests.filter((r) => r.status === filter);
    return matched.slice(0, 3);
  }, [filter, requests]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <AppScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
      >
        {/* Header — mirrors the shared BackButton styling, with a trailing
            notification bell unique to the overview. */}
        <View className="flex-row items-center gap-3 px-4 pb-1 pt-2">
          <Pressable
            onPress={goBack}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-95"
          >
            <ChevronLeft size={22} color="#14323F" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-center text-[18px] font-bold leading-6 text-ink"
              numberOfLines={1}
            >
              My Leave
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

        {/* Horizontally-scrolling balance tiles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TILE_WIDTH + TILE_GAP}
          decelerationRate="fast"
          contentContainerClassName="gap-3 px-4 pt-4"
        >
          {balances.map((b) => (
            <BalanceTile
              key={b.label}
              label={b.label}
              value={b.value}
              accent={b.accent}
            />
          ))}
        </ScrollView>

        {/* Apply actions */}
        <View className="mx-4 mt-4 gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Apply
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push('/apply-leave')}
              style={cardShadow}
              className="h-12 flex-1 items-center justify-center rounded-xl border border-transparent bg-ink px-2 active:scale-[0.98] active:bg-ink/90"
            >
              <Text numberOfLines={1} className="text-sm font-bold text-white">
                Leave
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/regularize')}
              style={cardShadow}
              className="h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 active:scale-[0.98] active:bg-slate-50"
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                className="text-sm font-bold text-ink"
              >
                Regularize
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/work-from-home')}
              style={cardShadow}
              className="h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 active:scale-[0.98] active:bg-slate-50"
            >
              <Text numberOfLines={1} className="text-sm font-bold text-ink">
                WFH/OD
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Requests header — eyebrow label matching the Balance section */}
        <View className="flex-row items-center justify-between px-4 pb-3 pt-6">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Requests
          </Text>
          <View className="flex-row items-center gap-3">
            <FilterIconButton onPress={() => setFilterOpen(true)} />
            <Pressable hitSlop={8} onPress={() => router.push('/requests')}>
              <Text className="text-sm font-bold text-ink">View all</Text>
            </Pressable>
          </View>
        </View>

        {/* Request list */}
        <View className="gap-4 px-4 pt-4">
          {isBackendSession && requestsQuery.isPending ? (
            <PageLoading label="Loading leave..." />
          ) : visible.map((r) => (
            <RequestCard
              key={r.id}
              type={r.type}
              category={r.category}
              reason={r.reason}
              appliedOn={r.appliedOn}
              actionDate={r.actionDate}
              dates={r.dates}
              days={r.days}
              status={r.status}
              icon={r.icon}
              rejectionReason={r.rejectionReason}
              // Same statuses the view-all page allows withdrawing.
              onCancel={
                r.status === 'Pending' || r.status === 'Approved'
                  ? () => setCancelTarget(r)
                  : undefined
              }
            />
          ))}
        </View>
      </AppScrollView>

      <CancelLeaveDialog
        request={cancelTarget}
        onKeep={() => setCancelTarget(null)}
        onConfirm={(request, reason) => {
          setCancelTarget(null);
          if (!isBackendSession) return;
          cancelRequest.mutate({ id: request.id, reason });
        }}
      />
      <FilterSheet
        visible={filterOpen}
        title="Leave requests"
        value={filter}
        options={FILTERS.map((f) => ({
          value: f,
          label: f,
          count: f === 'All' ? null : counts[f],
        }))}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}
