import { useRouter } from 'expo-router';
import { CalendarDays, History, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useMyLeaveSummary } from '../api/leave';
import { useAuth } from '../auth/AuthContext';
import { cardShadow } from './shadow';

/**
 * Mirrors the web dashboard's LeaveBalanceWidget — a headline "remaining
 * balance" tile beside the per-type available balances, then the three CTAs.
 * Live sessions read /api/requests/mine/summary; the demo session shows the
 * sample set.
 */

type LeaveType = {
  id: string;
  label: string;
  /** Current closing balance after posted accruals and deductions. */
  available: number;
  color: string;
};

// Same rotation the web widget assigns balances by index.
const COLORS = [
  '#E07856',
  '#5E9B7B',
  '#D4A24A',
  '#7C7BD8',
  '#2F6D7F',
  '#B96A00',
];

/** Offline demo fallback — a live session reads /requests/mine/summary. */
const BALANCES: LeaveType[] = [
  { id: 'casual', label: 'Casual', available: 7, color: COLORS[0] },
  { id: 'sick', label: 'Sick', available: 3, color: COLORS[1] },
  { id: 'earned', label: 'Earned', available: 12.5, color: COLORS[2] },
  { id: 'compoff', label: 'Comp-off', available: 1, color: COLORS[3] },
];

const BRAND_PRIMARY = '#0D3749';
const brandAlpha = (opacity: number) => `rgba(13, 55, 73, ${opacity})`;
const secondaryAlpha = (opacity: number) => `rgba(249, 211, 107, ${opacity})`;

/** Whole numbers render bare; halves keep a single decimal. */
function formatBalance(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(/\.0$/, '');
}

export default function LeaveBalanceCard() {
  const router = useRouter();
  // Demo session: no bearer token — the sample balances stand in rather than
  // firing a request that would 401 and sign the user out.
  const { isBackendSession } = useAuth();
  const summary = useMyLeaveSummary(isBackendSession);

  const balances = useMemo<LeaveType[]>(() => {
    if (!isBackendSession) return BALANCES;
    const rows = summary.data?.balances ?? [];
    return rows.map((row, index) => ({
      id: row.id,
      label: row.name || row.code,
      available: Math.max(0, Number(row.available ?? 0)),
      color: COLORS[index % COLORS.length],
    }));
  }, [isBackendSession, summary.data]);

  const remaining = useMemo(
    () => balances.reduce((sum, leave) => sum + leave.available, 0),
    [balances],
  );

  const year = Number(summary.data?.year) || new Date().getFullYear();

  return (
    // Shared app card chrome — matches the Holidays page cards.
    <View
      style={cardShadow}
      className="gap-4 rounded-[22px] border border-slate-100 bg-white px-5 py-5"
    >
      <Text className="text-[15px] font-bold" style={{ color: BRAND_PRIMARY }}>
        Leave balance · FY{String(year).slice(-2)}
      </Text>

      <View className="flex-row items-center gap-4">
        {/* Headline tile — the single number employees actually look for. */}
        <View
          className="w-[132px] justify-start gap-2 rounded-2xl border px-4 py-3.5"
          style={{
            minHeight: 132,
            backgroundColor: secondaryAlpha(0.12),
            borderColor: secondaryAlpha(0.22),
          }}
        >
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: brandAlpha(0.55) }}
          >
            Remaining balance
          </Text>
          <Text
            className="text-[35px] font-bold leading-none"
            style={{ color: BRAND_PRIMARY, letterSpacing: -1 }}
          >
            {formatBalance(remaining)}
          </Text>
        </View>

        <View className="min-w-0 flex-1 gap-1.5">
          {balances.length === 0 ? (
            <Text className="text-sm" style={{ color: brandAlpha(0.55) }}>
              {summary.isPending
                ? 'Loading balances…'
                : 'No leave balances available.'}
            </Text>
          ) : null}
          {balances.map((leave) => (
            <View key={leave.id} className="flex-row items-center gap-2.5">
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: leave.color }}
              />
              <Text
                className="min-w-0 flex-1 text-sm"
                style={{ color: brandAlpha(0.78) }}
                numberOfLines={1}
              >
                {leave.label}
              </Text>
              <Text
                className="text-sm font-bold"
                style={{ color: BRAND_PRIMARY }}
              >
                {formatBalance(leave.available)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Apply leave spans the full width; the two ghost actions split the row
          beneath it, same as the web widget's footer grid. */}
      <View className="gap-2.5">
        <Pressable
          onPress={() => router.push('/apply-leave')}
          accessibilityRole="button"
          className="h-11 flex-row items-center justify-center gap-1.5 rounded-xl active:opacity-90"
          style={{ backgroundColor: BRAND_PRIMARY }}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">Apply leave</Text>
        </Pressable>

        <View className="flex-row gap-2.5">
          <Pressable
            // A tab route, so navigate (not push) — push would stack a second
            // copy instead of switching to the tab.
            onPress={() => router.navigate('/leave')}
            accessibilityRole="button"
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border bg-white active:opacity-70"
            style={{ borderColor: brandAlpha(0.12) }}
          >
            <History size={14} color={BRAND_PRIMARY} />
            <Text
              className="text-sm font-semibold"
              style={{ color: BRAND_PRIMARY }}
            >
              Leave history
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/events')}
            accessibilityRole="button"
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border bg-white active:opacity-70"
            style={{ borderColor: brandAlpha(0.12) }}
          >
            <CalendarDays size={14} color={BRAND_PRIMARY} />
            <Text
              className="text-sm font-semibold"
              style={{ color: BRAND_PRIMARY }}
            >
              Holidays
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
