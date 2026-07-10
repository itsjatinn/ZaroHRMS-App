import type { LucideIcon } from 'lucide-react-native';
import { X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';

export type RequestStatus = 'Approved' | 'Pending' | 'Rejected';

type RequestCardProps = {
  type: string; // e.g. "Annual Leave"
  dates: string; // e.g. "12 – 14 Aug 2026"
  days: string; // e.g. "3 days"
  status: RequestStatus;
  icon: LucideIcon;
  iconColor: string;
  badgeClass: string; // pastel icon badge bg, e.g. "bg-blue-100"
  onCancel?: () => void;
};

// Per-status visual treatment for the left accent bar and status pill.
const STATUS_STYLES: Record<
  RequestStatus,
  { accent: string; pill: string; text: string; dot: string }
> = {
  Approved: {
    accent: '#22C55E',
    pill: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: '#059669',
  },
  Pending: {
    accent: '#F59E0B',
    pill: 'bg-amber-100',
    text: 'text-amber-700',
    dot: '#D97706',
  },
  Rejected: {
    accent: '#EF4444',
    pill: 'bg-red-100',
    text: 'text-red-700',
    dot: '#DC2626',
  },
};

// A single leave-request row: colored status accent, icon badge, dates,
// a status pill, and an optional "Cancel leave" action.
export default function RequestCard({
  type,
  dates,
  days,
  status,
  icon: Icon,
  iconColor,
  badgeClass,
  onCancel,
}: RequestCardProps) {
  const s = STATUS_STYLES[status];
  const cancellable = status !== 'Rejected' && onCancel;

  return (
    <View
      style={cardShadow}
      className="flex-row overflow-hidden rounded-3xl border border-slate-100 bg-white"
    >
      {/* Left status accent bar */}
      <View style={{ width: 5, backgroundColor: s.accent }} />

      <View className="flex-1 p-4">
        <View className="flex-row items-center gap-3">
          <View
            className={`h-11 w-11 items-center justify-center rounded-2xl ${badgeClass}`}
          >
            <Icon size={20} color={iconColor} />
          </View>

          <View className="flex-1">
            <Text className="text-base font-bold text-ink">{type}</Text>
            <Text className="mt-0.5 text-xs font-medium text-slate-400">
              {dates} · {days}
            </Text>
          </View>

          <View
            className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${s.pill}`}
          >
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: s.dot }}
            />
            <Text className={`text-xs font-bold ${s.text}`}>{status}</Text>
          </View>
        </View>

        {cancellable ? (
          <>
            <View className="mt-3 border-t border-slate-100" />
            <View className="mt-3 flex-row justify-end">
              <Pressable
                onPress={onCancel}
                className="flex-row items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 active:opacity-70"
              >
                <X size={15} color="#EF4444" strokeWidth={2.5} />
                <Text className="text-sm font-bold text-red-500">
                  Cancel leave
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}
