import { useRouter } from 'expo-router';
import { BookOpen, ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useApplicableLeaveTypes,
  useCancelMyRequest,
  useMyRequests,
} from '../../../src/api/leave';
import { useModuleGate } from '../../../src/api/modules';
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

type BalanceView = {
  label: string;
  value: number;
  accent: string;
  highlighted?: boolean;
  orderKind?: 'regular' | 'comp-off' | 'loss-of-pay';
};

function normalizedLeaveName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isCompOffLabel(value: string) {
  const normalized = normalizedLeaveName(value);
  return normalized === 'compoff' || normalized === 'compensatoryoff';
}

function isLossOfPayLabel(value: string) {
  const normalized = normalizedLeaveName(value);
  return normalized === 'lop' || normalized === 'lossofpay';
}

function orderBalanceTiles(tiles: BalanceView[]) {
  const regular: BalanceView[] = [];
  const compOff: BalanceView[] = [];
  const lossOfPay: BalanceView[] = [];

  for (const tile of tiles) {
    if (tile.orderKind === 'loss-of-pay') lossOfPay.push(tile);
    else if (tile.orderKind === 'comp-off') compOff.push(tile);
    else regular.push(tile);
  }

  return [...regular, ...compOff, ...lossOfPay];
}

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
  const { isBackendSession } = useAuth();
  const gate = useModuleGate(isBackendSession);
  const [filter, setFilter] = useState<Filter>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const cancelRequest = useCancelMyRequest();
  const [cancelTarget, setCancelTarget] = useState<Request | null>(null);

  // Live balances (tenant types, gender-filtered) and the real request feed;
  // the demo session keeps its samples.
  const applicable = useApplicableLeaveTypes(isBackendSession);
  const requestsQuery = useMyRequests(isBackendSession);

  const balances = useMemo(
    () => {
      const tiles = isBackendSession
        ? applicable.types.map<BalanceView>((type, index) => {
            const identity = `${type.key} ${type.label} ${type.short}`;
            const isLossOfPay = isLossOfPayLabel(identity);
            const isCompOff = isCompOffLabel(identity);
            return {
              label: type.short,
              value: type.remaining,
              accent: isLossOfPay
                ? '#475467'
                : isCompOff
                  ? '#0F9488'
                  : TILE_ACCENTS[index % TILE_ACCENTS.length],
              highlighted: isLossOfPay,
              orderKind: isLossOfPay
                ? 'loss-of-pay'
                : isCompOff
                  ? 'comp-off'
                  : 'regular',
            };
          })
        : BALANCES;
      return orderBalanceTiles(tiles);
    },
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

  /** Overview cap — the rest live behind "View all". */
  const OVERVIEW_LIMIT = 5;

  // The filter applies BEFORE the cap, so "Pending" shows the 5 most recent
  // pending requests rather than the pending subset of the latest 5.
  const matchedCount = useMemo(
    () =>
      (filter === 'All'
        ? requests
        : requests.filter((r) => r.status === filter)
      ).length,
    [filter, requests],
  );
  const visible = useMemo(() => {
    const matched =
      filter === 'All'
        ? requests
        : requests.filter((r) => r.status === filter);
    return matched.slice(0, OVERVIEW_LIMIT);
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
        {/* Header — mirrors the shared BackButton styling. */}
        <View className="flex-row items-center gap-3 px-4 pb-1 pt-2">
          <Pressable
            onPress={goBack}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-95"
          >
            <ChevronLeft size={22} color="#14323F" />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text
              className="text-left text-[18px] font-bold leading-6 text-ink"
              numberOfLines={1}
            >
              My Leave
            </Text>
          </View>
          {/* Balance ledger — the "why is my balance X?" trail. Same h-10
              pill styling as the back button so the row reads as one bar.
              Hidden when the tenant has no Leave module: the destination
              would only be able to say the module is off. */}
          {gate.leaveOn ? (
          <Pressable
            onPress={() => router.push('/balance-ledger')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Balance ledger"
            className="h-10 flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 active:scale-95"
          >
            <BookOpen size={15} color="#14323F" />
            <Text className="text-[13px] font-bold text-ink">Ledger</Text>
          </Pressable>
          ) : null}
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
              highlighted={b.highlighted}
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
              {/* Names the remainder, so the cap is visible rather than
                  silently hiding requests behind a generic link. */}
              <Text className="text-sm font-bold text-ink">
                {matchedCount > OVERVIEW_LIMIT
                  ? `View all (${matchedCount})`
                  : 'View all'}
              </Text>
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
