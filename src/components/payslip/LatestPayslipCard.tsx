import { Download, Wallet } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { formatINR, type Payslip } from './payslipData';

type Props = {
  payslip: Payslip;
  onDownload: (payslip: Payslip) => void;
};

export default function LatestPayslipCard({ payslip, onDownload }: Props) {
  return (
    <View style={cardShadow} className="rounded-2xl bg-[#14323F] p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Wallet size={20} color="#F5D14E" />
          </View>
          <View>
            <Text className="text-xs uppercase tracking-wider text-white/50">
              Latest Payslip
            </Text>
            <Text className="text-base font-bold text-white">
              {payslip.month}
            </Text>
          </View>
        </View>
        <View className="rounded-full bg-emerald-500/20 px-3 py-1">
          <Text className="text-xs font-semibold text-emerald-300">
            {payslip.status}
          </Text>
        </View>
      </View>

      {/* Net pay */}
      <View className="mt-5">
        <Text className="text-3xl font-bold text-[#F5D14E]">
          {formatINR(payslip.net)}
        </Text>
        <Text className="mt-0.5 text-xs text-white/50">Net pay</Text>
      </View>

      {/* Gross / deductions */}
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-xl bg-white/10 px-3 py-2.5">
          <Text className="text-[11px] text-white/50">Gross</Text>
          <Text className="text-sm font-bold text-white">
            {formatINR(payslip.gross)}
          </Text>
        </View>
        <View className="flex-1 rounded-xl bg-white/10 px-3 py-2.5">
          <Text className="text-[11px] text-white/50">Deductions</Text>
          <Text className="text-sm font-bold text-white">
            {formatINR(payslip.deductions)}
          </Text>
        </View>
      </View>

      {/* Download PDF */}
      <Pressable
        onPress={() => onDownload(payslip)}
        className="mt-5 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-[#F5D14E] active:scale-[0.98]"
      >
        <Download size={18} color="#14323F" />
        <Text className="text-sm font-bold text-[#14323F]">Download PDF</Text>
      </Pressable>
    </View>
  );
}
