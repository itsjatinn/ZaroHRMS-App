import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import type { LeaveType } from './leaveData';

type BalanceCardProps = {
  leaveType: LeaveType | null;
  daysSelected: number;
};

// Dark navy card summarising the remaining balance for the chosen leave type.
export default function BalanceCard({
  leaveType,
  daysSelected,
}: BalanceCardProps) {
  const remaining = leaveType?.remaining ?? null;
  const after = remaining != null ? remaining - daysSelected : null;

  return (
    <View style={cardShadow} className="rounded-[24px] border border-white/10 bg-[#14323F] p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-white">
            Remaining Balance
          </Text>
          <Text className="mt-0.5 text-xs text-white/50">
            {leaveType ? leaveType.label : 'Select a leave type'}
          </Text>
        </View>

        {/* Right-aligned value */}
        <View className="items-end">
          <Text className="text-4xl font-bold text-[#F5D14E]">
            {remaining != null ? remaining : '--'}
          </Text>
          <Text className="text-[11px] uppercase tracking-wider text-white/40">
            days left
          </Text>
        </View>
      </View>

      {/* Remaining after this application */}
      <View className="mt-4 flex-row items-center justify-between rounded-xl bg-white/10 px-4 py-3">
        <Text className="text-xs text-white/60">Remaining after apply</Text>
        <Text className="text-base font-bold text-white">
          {after != null ? after : '--'}
        </Text>
      </View>
    </View>
  );
}
