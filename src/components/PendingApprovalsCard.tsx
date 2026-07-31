import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, CheckCircle2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Alert } from './CrossAlert';

import {
  useDecideApproval,
  useManagerApprovals,
} from '../api/approvals';
import { useIsManager } from '../api/team';
import { useAuth } from '../auth/AuthContext';
import {
  INITIAL_APPROVALS,
  TYPE_STYLE,
  toApproval,
  type Approval,
} from './approvals/approvalsData';
import { cardShadow } from './shadow';

/**
 * Manager home card: the approval queue's pending slice with one-tap
 * Approve / Reject — the app's counterpart to the web's
 * PendingApprovalsWidget, plus the inline actions the user wanted (the web
 * card only links out).
 *
 * Decisions reuse the approvals tab's exact mutation, so each kind lands on
 * its own endpoint (comp-off, optional holiday, cancellation, …).
 */

const VISIBLE = 3;

export default function PendingApprovalsCard() {
  const router = useRouter();
  const { isBackendSession } = useAuth();
  const { isManager } = useIsManager();
  const queueQuery = useManagerApprovals(isBackendSession && isManager);
  const decide = useDecideApproval();
  // Decided ids overlay the fetch until the refetch lands, so a tapped row
  // leaves the queue immediately. Demo decisions live here permanently.
  const [decided, setDecided] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useMemo(() => {
    const rows = isBackendSession
      ? (queueQuery.data?.pending ?? []).map((row) => toApproval(row, 'Pending'))
      : INITIAL_APPROVALS.filter((row) => row.status === 'Pending');
    return rows.filter((row) => !decided[row.id]);
  }, [isBackendSession, queueQuery.data, decided]);

  // Same composite gate as the tabs: explicit role OR reporting lines.
  if (!isManager) return null;

  const act = (row: Approval & { serverRow?: unknown }, approve: boolean) => {
    setBusyId(row.id);
    if (!isBackendSession || !('serverRow' in row) || !row.serverRow) {
      setDecided((current) => ({ ...current, [row.id]: true }));
      setBusyId(null);
      return;
    }
    decide.mutate(
      { row: row.serverRow as never, approve },
      {
        onSuccess: () =>
          setDecided((current) => ({ ...current, [row.id]: true })),
        onError: (error) =>
          Alert.alert(
            approve ? 'Could not approve' : 'Could not reject',
            error instanceof Error && error.message
              ? error.message
              : 'Please try again in a moment.',
          ),
        onSettled: () => setBusyId(null),
      },
    );
  };

  const openApprovals = () => router.push('/(drawer)/(tabs)/approvals');
  const visible = pending.slice(0, VISIBLE);

  return (
    <View
      style={cardShadow}
      className="rounded-[22px] border border-slate-100 bg-white p-4"
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-base font-bold text-ink">Pending approvals</Text>
        {pending.length ? (
          <View className="min-w-[22px] items-center rounded-full bg-amber-100 px-1.5 py-0.5">
            <Text className="text-[11px] font-bold text-amber-700">
              {pending.length}
            </Text>
          </View>
        ) : null}
        <View className="flex-1" />
        <Pressable
          onPress={openApprovals}
          accessibilityRole="button"
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text className="text-xs font-bold text-ink">View all</Text>
          <ArrowRight size={13} color="#14323F" />
        </Pressable>
      </View>

      {isBackendSession && queueQuery.isPending ? (
        <View className="items-center py-7">
          <ActivityIndicator color="#14323F" />
        </View>
      ) : visible.length === 0 ? (
        <View className="items-center gap-1 py-6">
          <CheckCircle2 size={22} color="#5E9B7B" />
          <Text className="text-sm font-semibold text-ink">All caught up</Text>
          <Text className="text-xs text-slate-400">
            Nothing is waiting on your decision.
          </Text>
        </View>
      ) : (
        visible.map((row, index) => {
          const typeStyle = TYPE_STYLE[row.type];
          const busy = busyId === row.id;
          return (
            <View
              key={row.id}
              className={`py-3 ${index > 0 ? 'border-t border-slate-100' : ''}`}
            >
              <Pressable
                onPress={openApprovals}
                accessibilityRole="button"
                className="flex-row items-center gap-3 active:opacity-70"
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: typeStyle.background }}
                >
                  <Feather
                    // approvalsData keys these to Feather glyph names.
                    name={typeStyle.icon as never}
                    size={15}
                    color={typeStyle.color}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                    {row.employee}
                  </Text>
                  <Text className="text-xs text-slate-500" numberOfLines={1}>
                    {row.title}
                    {row.days ? ` · ${row.days} day${row.days === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>
              </Pressable>

              {/* Second line: when it was raised on the left, actions on the
                  right — the date no longer squeezes the name row. */}
              <View className="mt-2.5 flex-row items-center pl-12">
                <Text className="flex-1 text-[11px] text-slate-400">
                  {row.submitted}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => act(row, false)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Reject ${row.employee}'s request`}
                    className="flex-row items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 active:opacity-70"
                    style={{ opacity: busy ? 0.6 : 1 }}
                  >
                    <X size={13} color="#E11D48" />
                    <Text className="text-xs font-bold text-rose-600">Reject</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => act(row, true)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Approve ${row.employee}'s request`}
                    className="flex-row items-center justify-center gap-1.5 rounded-xl bg-[#2F7D5B] px-3.5 py-2 active:opacity-80"
                    style={{ opacity: busy ? 0.6 : 1 }}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Check size={13} color="#FFFFFF" />
                    )}
                    <Text className="text-xs font-bold text-white">Approve</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })
      )}

      {pending.length > VISIBLE ? (
        <Text className="pt-1 text-center text-[11px] text-slate-400">
          {pending.length - VISIBLE} more in the approvals tab
        </Text>
      ) : null}
    </View>
  );
}
