import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { cardShadow } from '../shadow';

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  badgeClass: string; // pastel badge background, e.g. "bg-blue-100"
  className?: string;
};

// A single leave-balance stat: uppercase label, big number, pastel icon badge.
export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  badgeClass,
  className = '',
}: StatCardProps) {
  return (
    <View
      style={cardShadow}
      className={`rounded-[24px] border border-slate-100 bg-white p-4 ${className}`}
    >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </Text>
        <View
          className={`h-9 w-9 items-center justify-center rounded-xl ${badgeClass}`}
        >
          <Icon size={18} color={iconColor} />
        </View>
      </View>
      <Text className="mt-3 text-3xl font-bold text-ink">{value}</Text>
    </View>
  );
}
