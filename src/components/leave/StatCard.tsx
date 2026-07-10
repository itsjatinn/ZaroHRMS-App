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
  // "default" = label + number, icon badge top-right (rounded square).
  // "stacked" = circular icon badge on top, then label, then number.
  variant?: 'default' | 'stacked';
};

// A single leave-balance stat: label, big number, pastel icon badge.
export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  badgeClass,
  className = '',
  variant = 'default',
}: StatCardProps) {
  if (variant === 'stacked') {
    return (
      <View
        style={cardShadow}
        className={`rounded-2xl border border-slate-100 bg-white p-3 ${className}`}
      >
        <View
          className={`h-7 w-7 items-center justify-center rounded-full ${badgeClass}`}
        >
          <Icon size={15} color={iconColor} />
        </View>
        <Text className="mt-2 text-[11px] font-medium text-slate-500">
          {label}
        </Text>
        <Text className="mt-0.5 text-xl font-bold text-ink">{value}</Text>
      </View>
    );
  }

  return (
    <View
      style={cardShadow}
      className={`rounded-2xl border border-slate-100 bg-white p-3 ${className}`}
    >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </Text>
        <View
          className={`h-7 w-7 items-center justify-center rounded-lg ${badgeClass}`}
        >
          <Icon size={15} color={iconColor} />
        </View>
      </View>
      <Text className="mt-2 text-2xl font-bold text-ink">{value}</Text>
    </View>
  );
}
