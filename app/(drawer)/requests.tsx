import { useRouter } from 'expo-router';
import { CalendarX, ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Alert } from '../../src/components/CrossAlert';
import { SafeAreaView } from 'react-native-safe-area-context';

import Dropdown from '../../src/components/leave/Dropdown';
import AppScrollView from '../../src/components/AppScrollView';
import FilterSheet, { FilterIconButton } from '../../src/components/FilterSheet';
import PageLoading from '../../src/components/PageLoading';
import RequestCard from '../../src/components/leave/RequestCard';
import { useCancelMyRequest, useMyRequests } from '../../src/api/leave';
import { useAuth } from '../../src/auth/AuthContext';
import CancelLeaveDialog from '../../src/components/leave/CancelLeaveDialog';
import type { RequestStatus } from '../../src/components/leave/RequestCard';
import {
  REQUESTS,
  toRequest,
  type Request,
} from '../../src/components/leave/requestsData';
import { cardShadow } from '../../src/components/shadow';

const YEARS = ['2026', '2025', '2024'] as const;

// Every status the HRMS tracks — the old four hid cancelled and withdrawn
// requests entirely. Too many for a segmented control, so they scroll.
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

/** Sentinel for "no leave-type filter" — tenant types are arbitrary strings. */
const ANY_TYPE = 'All';

/** Statuses an employee can still withdraw. */
const CANCELLABLE: RequestStatus[] = ['Pending', 'Approved'];

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
  const { isBackendSession } = useAuth();
  const requestsQuery = useMyRequests(isBackendSession);
  const cancelRequest = useCancelMyRequest();
  const [filter, setFilter] = useState<Filter>('All');
  const [typeFilter, setTypeFilter] = useState<string>(ANY_TYPE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [year, setYear] = useState<string>('2026');
  const [cancelTarget, setCancelTarget] = useState<Request | null>(null);
  /**
   * Withdrawals applied locally, keyed by request id. The real flow will PATCH
   * the request; until then this at least makes the action do something rather
   * than silently discarding the tap.
   */
  const [withdrawn, setWithdrawn] = useState<Record<string, RequestStatus>>({});

  const requests = useMemo(() => {
    const source = isBackendSession
      ? (requestsQuery.data ?? []).map(toRequest)
      : REQUESTS;
    return source.map((r) =>
      withdrawn[r.id] ? { ...r, status: withdrawn[r.id] } : r,
    );
  }, [isBackendSession, requestsQuery.data, withdrawn]);

  const confirmCancel = (request: Request, reason: string) => {
    // HR reviews the withdrawal, so it becomes a request rather than a done
    // deal. Flip optimistically; the refetch reconciles.
    setWithdrawn((current) => ({
      ...current,
      [request.id]: 'Cancellation requested',
    }));
    setCancelTarget(null);

    if (!isBackendSession) return;
    cancelRequest.mutate(
      { id: request.id, reason },
      {
        onError: (error) => {
          setWithdrawn((current) => {
            const next = { ...current };
            delete next[request.id];
            return next;
          });
          Alert.alert(
            'Could not withdraw',
            error instanceof Error && error.message
              ? error.message
              : 'Please try again in a moment.',
          );
        },
      },
    );
  };

  const requestsForYear = useMemo(
    () =>
      requests.filter((request) => {
        const requestYear = request.month.match(/\b(\d{4})\b/)?.[1];
        return requestYear === year;
      }),
    [requests, year],
  );

  const counts = useMemo(
    () => ({
      All: requestsForYear.length,
      Pending: requestsForYear.filter((r) => r.status === 'Pending').length,
      Approved: requestsForYear.filter((r) => r.status === 'Approved').length,
      Rejected: requestsForYear.filter((r) => r.status === 'Rejected').length,
    }),
    [requestsForYear],
  );

  /**
   * Leave types are tenant-defined, so the options are whatever this year's
   * feed actually contains. Scoped to the year for the same reason the status
   * counts are: the list on screen is already year-filtered, so offering a
   * type that only exists in another year would filter to nothing.
   */
  const leaveTypes = useMemo(() => {
    const counted = new Map<string, number>();
    for (const request of requestsForYear) {
      const label = request.type?.trim();
      if (!label) continue;
      counted.set(label, (counted.get(label) ?? 0) + 1);
    }
    return [...counted.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [requestsForYear]);

  // Switching year (or a refetch) can drop the selected type. Left alone the
  // list would sit empty against a filter no longer offered.
  const activeType =
    typeFilter === ANY_TYPE || leaveTypes.some(([label]) => label === typeFilter)
      ? typeFilter
      : ANY_TYPE;

  const visible = useMemo(
    () =>
      requestsForYear.filter(
        (r) =>
          (filter === 'All' || r.status === filter) &&
          (activeType === ANY_TYPE || r.type === activeType),
      ),
    [filter, activeType, requestsForYear],
  );

  /** "pending · Sick Leave", or empty when nothing is filtered. */
  const activeFilterSummary = [
    filter === 'All' ? null : filter.toLowerCase(),
    activeType === ANY_TYPE ? null : activeType,
  ]
    .filter(Boolean)
    .join(' · ');

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
          className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-95"
        >
          <ChevronLeft size={22} color="#14323F" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text
            className="text-center text-[18px] font-bold leading-6 text-ink"
            numberOfLines={1}
          >
            Leave Requests
          </Text>
        </View>
        <Dropdown
          className="w-28"
          value={year}
          placeholder="2026"
          options={YEARS}
          onSelect={setYear}
          overlay
        />
      </View>

      {/* At-a-glance counts */}
      <View className="flex-row gap-2 px-4">
        <SummaryChip value={counts.All} label="Total" />
        <SummaryChip value={counts.Pending} label="Pending" />
        <SummaryChip value={counts.Approved} label="Approved" />
        <SummaryChip value={counts.Rejected} label="Rejected" />
      </View>

      <AppScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-32 pt-4"
      >
        {isBackendSession && requestsQuery.isPending ? (
          <PageLoading label="Loading requests..." />
        ) : grouped.length > 0 ? (
          grouped.map((section, i) => (
            <View key={`${section.month}-${i}`} className={i === 0 ? '' : 'mt-5'}>
              <View className="mb-3 min-h-10 flex-row items-center justify-between">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.month}
                </Text>
                {i === 0 ? (
                  <FilterIconButton onPress={() => setFilterOpen(true)} />
                ) : null}
              </View>
              <View className="gap-4">
                {section.items.map((r) => (
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
                    attachments={r.attachments}
                    requestId={isBackendSession ? r.id : undefined}
                    onCancel={
                      CANCELLABLE.includes(r.status)
                        ? () => setCancelTarget(r)
                        : undefined
                    }
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
              No requests found
            </Text>
            <Text className="px-10 text-center text-sm text-slate-400">
              {/* Name the filters actually in play. The old copy interpolated
                  the status unconditionally, which read as "no all requests",
                  and it never mentioned the type at all. */}
              {activeFilterSummary
                ? `Nothing matches ${activeFilterSummary} in ${year}.`
                : `You have no leave requests in ${year}.`}
            </Text>
          </View>
        )}
      </AppScrollView>
      <CancelLeaveDialog
        request={cancelTarget}
        onKeep={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
      {/* Status + leave type in one sheet. With `sections` it stays open until
          dismissed, so both can be set in a single visit. */}
      <FilterSheet
        visible={filterOpen}
        title="Requests"
        value={filter}
        sections={[
          {
            title: 'Status',
            value: filter,
            options: FILTERS.map((f) => ({ value: f, label: f })),
            onChange: (next) => setFilter(next as Filter),
          },
          {
            title: 'Leave type',
            value: activeType,
            options: [
              { value: ANY_TYPE, label: 'All' },
              ...leaveTypes.map(([label, count]) => ({
                value: label,
                label,
                count,
              })),
            ],
            onChange: setTypeFilter,
          },
        ]}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}
