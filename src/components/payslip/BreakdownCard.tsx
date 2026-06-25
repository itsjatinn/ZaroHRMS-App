import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { DEDUCTIONS, EARNINGS, formatINR } from './payslipData';

type Props = {
  month: string;
};

function Row({ label, amount, negative }: { label: string; amount: number; negative?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="text-sm font-semibold text-ink">
        {negative ? '- ' : ''}
        {formatINR(amount)}
      </Text>
    </View>
  );
}

export default function BreakdownCard({ month }: Props) {
  const totalEarnings = EARNINGS.reduce((s, e) => s + e.amount, 0);
  const totalDeductions = DEDUCTIONS.reduce((s, d) => s + d.amount, 0);
  const net = totalEarnings - totalDeductions;

  return (
    <View style={cardShadow} className="rounded-2xl bg-white p-5">
      <Text className="text-base font-bold text-ink">Salary Breakdown</Text>
      <Text className="text-xs text-slate-400">{month}</Text>

      {/* Earnings */}
      <View className="mt-4 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
          <TrendingUp size={15} color="#059669" />
        </View>
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Earnings
        </Text>
      </View>
      <View className="mt-2">
        {EARNINGS.map((e) => (
          <Row key={e.label} label={e.label} amount={e.amount} />
        ))}
      </View>

      {/* Deductions */}
      <View className="mt-4 flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
          <TrendingDown size={15} color="#E11D48" />
        </View>
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Deductions
        </Text>
      </View>
      <View className="mt-2">
        {DEDUCTIONS.map((d) => (
          <Row key={d.label} label={d.label} amount={d.amount} negative />
        ))}
      </View>

      {/* Net total */}
      <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4">
        <Text className="text-sm font-bold text-ink">Net Pay</Text>
        <Text className="text-lg font-bold text-emerald-600">
          {formatINR(net)}
        </Text>
      </View>
    </View>
  );
}
