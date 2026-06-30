import { ArrowDownToLine, FileText } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Dropdown from '../leave/Dropdown';
import { cardShadow } from '../shadow';
import { PAYSLIPS, formatINR, type Payslip } from './payslipData';

const YEARS = ['2026', '2025'] as const;

type Props = {
  onDownload: (payslip: Payslip) => void;
};

export default function PayslipList({ onDownload }: Props) {
  const [year, setYear] = useState<string>('2026');

  // Filter the history by the selected year (id starts with the year).
  const rows = PAYSLIPS.filter((p) => p.id.startsWith(year));

  return (
    <View style={cardShadow} className="rounded-2xl bg-white p-5">
      {/* Header + year filter */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">Payslip History</Text>
        <Dropdown
          className="w-24"
          value={year}
          placeholder="2026"
          options={YEARS}
          onSelect={setYear}
        />
      </View>

      {/* Rows */}
      <View className="mt-3">
        {rows.length === 0 ? (
          <Text className="py-8 text-center text-sm text-slate-400">
            No payslips for {year}.
          </Text>
        ) : (
          rows.map((p, i) => (
            <Fragment key={p.id}>
              {i > 0 && <View className="border-b border-slate-100" />}
              <View className="flex-row items-center gap-3 py-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <FileText size={18} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink">{p.month}</Text>
                  <Text className="text-xs text-slate-400">
                    Net {formatINR(p.net)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onDownload(p)}
                  hitSlop={6}
                  className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 active:scale-95"
                >
                  <ArrowDownToLine size={18} color="#14323F" />
                </Pressable>
              </View>
            </Fragment>
          ))
        )}
      </View>
    </View>
  );
}
