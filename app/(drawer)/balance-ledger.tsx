import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ledgerKindLabel, useLeaveLedger, type LedgerEntry } from '../../src/api/leave';
import { useModuleGate } from '../../src/api/modules';
import { useAuth } from '../../src/auth/AuthContext';
import AppScrollView from '../../src/components/AppScrollView';
import BackButton from '../../src/components/BackButton';
import FilterSheet, { FilterIconButton } from '../../src/components/FilterSheet';
import PageLoading from '../../src/components/PageLoading';
import { cardShadow } from '../../src/components/shadow';

const ALL = 'All types';

/** "2026-07-20T…" → "20/07/2026", matching the web ledger's date headings. */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Signed day pill: green for a credit, red for a debit — as on the web. */
function DeltaPill({ delta }: { delta: number }) {
  const credit = delta > 0;
  const rounded = Math.round(Math.abs(delta) * 2) / 2;
  return (
    <View
      className="mr-3 items-center justify-center rounded-lg px-2.5 py-1.5"
      style={{ backgroundColor: credit ? '#E7F4EC' : '#FDEBEC', minWidth: 52 }}
    >
      <Text
        className="text-[12px] font-bold"
        style={{ color: credit ? '#347553' : '#B54246' }}
      >
        {credit ? '+' : '−'}
        {rounded}d
      </Text>
    </View>
  );
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  return (
    <View className="flex-row items-start py-3">
      <DeltaPill delta={entry.delta} />
      <View className="min-w-0 flex-1">
        <Text className="text-[13.5px] font-bold text-ink">
          {ledgerKindLabel(entry.kind)}
        </Text>
        {/* The reason — a comp-off's worked date, or HR's remark on a
            manual adjustment. This is what makes a balance explainable. */}
        {entry.note ? (
          <Text className="mt-0.5 text-[12px] leading-[17px] text-slate-500">
            {entry.note}
          </Text>
        ) : null}
        {entry.leaveTypeName ? (
          <Text className="mt-0.5 text-[11px] text-slate-400">
            {entry.leaveTypeName}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function BalanceLedgerScreen() {
  const { isBackendSession } = useAuth();
  // The ledger is a Leave-module surface, and its endpoint enforces the same
  // gate server-side. Asking while the module is off would only ever return
  // an error, so the query is not fired at all — the gate fails closed until
  // the module list resolves.
  const gate = useModuleGate(isBackendSession);
  const ledgerQuery = useLeaveLedger(isBackendSession && gate.leaveOn);
  const entries = useMemo(() => ledgerQuery.data ?? [], [ledgerQuery.data]);

  const [filter, setFilter] = useState(ALL);
  const [filterOpen, setFilterOpen] = useState(false);

  // Options come from the data, never a hardcoded list — same rule the web
  // ledger follows, so a tenant's own leave types always appear.
  const types = useMemo(() => {
    const names = new Set<string>();
    for (const entry of entries) {
      if (entry.leaveTypeName) names.add(entry.leaveTypeName);
    }
    return [ALL, ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [entries]);

  // Grouped by day, newest first — the API already returns newest-first, so
  // insertion order gives the right group order.
  const groups = useMemo(() => {
    const map = new Map<string, LedgerEntry[]>();
    for (const entry of entries) {
      if (filter !== ALL && entry.leaveTypeName !== filter) continue;
      const key = entry.createdAt.slice(0, 10);
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    }
    return Array.from(map.entries());
  }, [entries, filter]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <AppScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Filter sits in the header row, right of the title — the screen
            needs no eyebrow label or description to explain itself. */}
        <BackButton
          title="Balance ledger"
          right={
            types.length > 1 ? (
              <FilterIconButton onPress={() => setFilterOpen(true)} />
            ) : undefined
          }
        />

        {isBackendSession && !gate.leaveOn ? (
          <View className="mx-4 mt-4 items-center rounded-2xl border border-slate-200 bg-white py-12">
            <Feather name="lock" size={26} color="#CBD5E1" />
            <Text className="mt-3 text-sm font-bold text-ink">
              Leave isn&apos;t enabled
            </Text>
            <Text className="mt-1 px-8 text-center text-xs text-slate-400">
              Your organisation doesn&apos;t have the Leave module turned on, so
              there are no balances to track.
            </Text>
          </View>
        ) : isBackendSession && ledgerQuery.isPending ? (
          <PageLoading label="Loading balance ledger..." />
        ) : groups.length === 0 ? (
          <View className="mx-4 mt-4 items-center rounded-2xl border border-slate-200 bg-white py-12">
            <Feather name="book-open" size={28} color="#CBD5E1" />
            <Text className="mt-3 text-sm font-bold text-ink">
              No movements yet
            </Text>
            <Text className="mt-1 px-8 text-center text-xs text-slate-400">
              Accruals, leave taken, comp-offs and HR adjustments will appear
              here as they happen.
            </Text>
          </View>
        ) : (
          <View className="gap-4 px-4 pt-4">
            {groups.map(([day, rows]) => (
              <View key={day}>
                <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {dayLabel(day)}
                </Text>
                <View
                  style={cardShadow}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-3"
                >
                  {rows.map((entry, index) => (
                    <View
                      key={entry.id}
                      className={index > 0 ? 'border-t border-slate-100' : ''}
                    >
                      <LedgerRow entry={entry} />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </AppScrollView>

      <FilterSheet
        visible={filterOpen}
        title="Leave type"
        value={filter}
        options={types.map((type) => ({ value: type, label: type }))}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}
