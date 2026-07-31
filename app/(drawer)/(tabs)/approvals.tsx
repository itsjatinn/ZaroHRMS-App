import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, TextInput, UIManager, View } from 'react-native';
import { Alert } from '../../../src/components/CrossAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useDecideApproval,
  useManagerApprovals,
} from '../../../src/api/approvals';
import { useAuth } from '../../../src/auth/AuthContext';
import BackButton from '../../../src/components/BackButton';
import AppScrollView from '../../../src/components/AppScrollView';
import FilterSheet, { FilterIconButton } from '../../../src/components/FilterSheet';
import PageLoading from '../../../src/components/PageLoading';
import {
  INITIAL_APPROVALS,
  STATUS_FILTERS,
  STATUS_STYLE,
  toApproval,
  TYPE_FILTERS,
  TYPE_STYLE,
  type Approval,
  type ApprovalStatus,
} from '../../../src/components/approvals/approvalsData';
import { useIsManager } from '../../../src/api/team';
import { cardShadow } from '../../../src/components/shadow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">{label}</Text>
      <Text className="mt-0.5 text-xs font-bold text-ink">{value}</Text>
    </View>
  );
}

function ApprovalCard({
  request,
  expanded,
  onToggle,
  onDecision,
}: {
  request: Approval;
  expanded: boolean;
  onToggle: () => void;
  onDecision: (id: string, status: ApprovalStatus) => void;
}) {
  const typeStyle = TYPE_STYLE[request.type];
  const statusStyle = STATUS_STYLE[request.status];

  const decide = (status: ApprovalStatus) => {
    Alert.alert(
      `${status === 'Approved' ? 'Approve' : 'Reject'} request?`,
      `${request.employee}'s ${request.title.toLowerCase()} request will be ${status.toLowerCase()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'Approved' ? 'Approve' : 'Reject',
          style: status === 'Rejected' ? 'destructive' : 'default',
          onPress: () => onDecision(request.id, status),
        },
      ],
    );
  };

  return (
    <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={cardShadow}>
      {/* Collapsed summary — enough to triage without opening the card. */}
      <Pressable
        onPress={onToggle}
        className={`${expanded ? 'px-4 pb-2 pt-4' : 'p-4'} active:opacity-90`}
      >
        <View className="flex-row items-start">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Text className="text-xs font-bold text-slate-500">{request.initials}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center">
              <Text className="text-sm font-bold text-ink" numberOfLines={1}>{request.employee}</Text>
              <Text className="ml-2 flex-1 text-[11px] text-slate-400" numberOfLines={1}>{request.role}</Text>
            </View>
            <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
              <View className="flex-row items-center rounded-md px-2 py-0.5" style={{ backgroundColor: typeStyle.background }}>
                <Feather name={typeStyle.icon as keyof typeof Feather.glyphMap} size={9} color={typeStyle.color} />
                <Text className="ml-1 text-[9px] font-bold" style={{ color: typeStyle.color }}>{request.type}</Text>
              </View>
              <Text className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">{request.stage}</Text>
            </View>
            {!expanded ? (
              <Text className="mt-1.5 text-[11px] text-slate-500" numberOfLines={1}>
                {request.title} · {request.days} day{request.days === 1 ? '' : 's'} · {request.from} to {request.to}
              </Text>
            ) : null}
          </View>
          <View className="ml-2 items-end">
            <Text className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
              {request.status}
            </Text>
            <View className="mt-1.5 flex-row items-center gap-2">
              <View className="flex-row items-center">
                <Feather name="clock" size={9} color="#94A3B8" />
                <Text className="ml-1 text-[9px] text-slate-400">{request.submitted}</Text>
              </View>
              <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
            </View>
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View className="px-4 pb-4">
          <Text className="text-xs leading-5 text-slate-500">{request.reason}</Text>

          <View className="mt-3 flex-row rounded-xl bg-slate-50 p-3">
            <DetailCell label="Type" value={request.type} />
            <DetailCell label="Days" value={`${request.days}`} />
            <DetailCell label="From" value={request.from} />
            <DetailCell label="To" value={request.to} />
          </View>

          <View className="mt-3 rounded-xl bg-[#EFEEFC] p-3">
            <Text className="text-[11px] font-bold text-[#645CB5]">{request.stage}</Text>
            <Text className="mt-0.5 text-[11px] text-slate-500">{request.stageNote}</Text>
          </View>

          {/* Coverage check: who else on the team is out in the same window. */}
          {request.overlaps.length ? (
            <View className="mt-3 rounded-xl border border-[#F0DFAE] bg-[#FFFBF0] p-3">
              <View className="flex-row items-center">
                <Feather name="users" size={13} color="#A16D13" />
                <Text className="ml-1.5 flex-1 text-[11px] font-bold text-[#A16D13]">Team also on leave</Text>
                <Text className="rounded-full bg-[#FFF3D6] px-2 py-0.5 text-[9px] font-bold text-[#A16D13]">
                  {request.overlaps.length} overlapping
                </Text>
              </View>
              <View className="mt-2 gap-2">
                {request.overlaps.map((overlap) => (
                  <View key={`${overlap.name}-${overlap.period}`} className="flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-ink">{overlap.name}</Text>
                      <Text className="text-[9px] text-slate-400">{overlap.role}</Text>
                    </View>
                    <Text className="mr-2 text-[10px] text-slate-500" numberOfLines={1}>
                      {overlap.period} · {overlap.leaveType}
                    </Text>
                    <Text
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={
                        overlap.state === 'Approved'
                          ? { backgroundColor: '#E8F5EF', color: '#2F7D5B' }
                          : { backgroundColor: '#FFF4D9', color: '#9B6A12' }
                      }
                    >
                      {overlap.state}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {request.status === 'Pending' ? (
            <View className="mt-4 flex-row gap-3">
              <Pressable onPress={() => decide('Rejected')} className="flex-1 flex-row items-center justify-center rounded-xl border border-rose-200 bg-white py-2.5 active:opacity-70">
                <Feather name="x" size={14} color="#F43F5E" />
                <Text className="ml-1.5 text-sm font-bold text-rose-500">Reject</Text>
              </Pressable>
              <Pressable onPress={() => decide('Approved')} className="flex-1 flex-row items-center justify-center rounded-xl bg-[#2F7D5B] py-2.5 active:opacity-80">
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text className="ml-1.5 text-sm font-bold text-white">Approve</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function ApprovalsScreen() {
  const { isBackendSession } = useAuth();
  const managerAccess = useIsManager();
  const insets = useSafeAreaInsets();

  // Live queue: the same status=all fetch the web makes, so the tab counts are
  // real. Locally decided ids overlay the fetch until the refetch lands. The
  // demo session keeps its sample queue.
  const queueQuery = useManagerApprovals(isBackendSession);
  const decide = useDecideApproval();
  const [decidedLocally, setDecidedLocally] = useState<
    Record<string, ApprovalStatus>
  >({});
  const [demoRequests, setDemoRequests] = useState(INITIAL_APPROVALS);

  const requests = useMemo<Approval[]>(() => {
    if (!isBackendSession) return demoRequests;
    const slices = queueQuery.data;
    const rows = [
      ...(slices?.pending ?? []).map((row) => toApproval(row, 'Pending')),
      ...(slices?.approved ?? []).map((row) => toApproval(row, 'Approved')),
      ...(slices?.rejected ?? []).map((row) => toApproval(row, 'Rejected')),
    ];
    return rows.map((row) =>
      decidedLocally[row.id] ? { ...row, status: decidedLocally[row.id] } : row,
    );
  }, [isBackendSession, queueQuery.data, decidedLocally, demoRequests]);
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>('All types');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('Pending');
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'Pending').length,
    [requests],
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesSearch =
        !search ||
        `${item.employee} ${item.title} ${item.type} ${item.reason}`.toLowerCase().includes(search);
      return (
        matchesSearch &&
        (type === 'All types' || item.type === type) &&
        (status === 'All' || item.status === status)
      );
    });
  }, [requests, type, status, query]);

  // Composite gate (explicit role OR reporting lines), and only bounce once
  // the server has answered — the old role-only check here is what made the
  // tab appear and then instantly redirect home for reporting-line managers.
  if (managerAccess.ready && !managerAccess.isManager) {
    return <Redirect href="/" />;
  }

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((current) => (current === id ? null : id));
  };

  const updateDecision = (id: string, nextStatus: ApprovalStatus) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (!isBackendSession) {
      setDemoRequests((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item,
        ),
      );
      return;
    }

    // The adapter keeps the raw queue row on the view model — the decision
    // endpoint and payload depend on its kind (comp-off, optional holiday and
    // cancellations all route differently).
    const target = requests.find((item) => item.id === id) as
      | (Approval & { serverRow?: import('../../../src/api/approvals').ServerApprovalRow })
      | undefined;
    if (!target?.serverRow) return;

    // Optimistic flip; the refetch after the PATCH settles reconciles it.
    setDecidedLocally((current) => ({ ...current, [id]: nextStatus }));
    decide.mutate(
      { row: target.serverRow, approve: nextStatus === 'Approved' },
      {
        onError: (error) => {
          setDecidedLocally((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
          Alert.alert(
            'Could not submit your decision',
            error instanceof Error && error.message
              ? error.message
              : 'Please try again in a moment.',
          );
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Approvals"
      />

      <AppScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 112 }}
      >
        <View className="gap-3 px-4 pt-3">
          <View className="flex-row items-center gap-2">
            <View className="min-w-0 flex-1 flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
              <Feather name="search" size={18} color="#94A3B8" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name, summary…"
                placeholderTextColor="#94A3B8"
                className="ml-2 h-12 flex-1 text-sm text-ink"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Feather name="x" size={16} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>
            <FilterIconButton onPress={() => setFilterOpen(true)} />
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-ink">
              {status === 'Pending' ? 'Pending approvals' : status === 'All' ? 'All requests' : `${status} requests`}
            </Text>
            <Text className="text-xs text-slate-400">
              {visible.length} request{visible.length === 1 ? '' : 's'}
            </Text>
          </View>

          <View className="gap-3">
            {isBackendSession && queueQuery.isPending ? (
              <PageLoading label="Loading approvals..." />
            ) : visible.map((request) => (
              <ApprovalCard
                key={request.id}
                request={request}
                expanded={expandedId === request.id}
                onToggle={() => toggle(request.id)}
                onDecision={updateDecision}
              />
            ))}
            {!queueQuery.isPending && visible.length === 0 ? (
              <View className="items-center rounded-2xl border border-slate-200 bg-white px-8 py-12">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Feather name="check-circle" size={25} color="#94A3B8" />
                </View>
                <Text className="mt-3 text-base font-bold text-ink">You’re all caught up</Text>
                <Text className="mt-1 text-center text-sm text-slate-400">
                  {pendingCount ? 'Nothing matches these filters.' : 'There is nothing waiting on you.'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </AppScrollView>
      <FilterSheet
        visible={filterOpen}
        title="Approvals"
        value={status}
        sections={[
          {
            title: 'Type',
            value: type,
            options: TYPE_FILTERS.map((item) => ({ value: item, label: item })),
            onChange: (next) => setType(next as typeof type),
          },
          {
            title: 'Status',
            value: status,
            options: STATUS_FILTERS.map((item) => ({ value: item, label: item })),
            onChange: (next) => setStatus(next as typeof status),
          },
        ]}
        onClose={() => setFilterOpen(false)}
      />

    </SafeAreaView>
  );
}
