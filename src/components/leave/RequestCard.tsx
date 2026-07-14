import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';

export type RequestStatus = 'Approved' | 'Pending' | 'Rejected';

type RequestCardProps = {
  type: string; // e.g. "Annual Leave"
  dates: string; // e.g. "12 – 14 Aug 2026"
  days: string; // e.g. "3 days"
  status: RequestStatus;
  icon: LucideIcon;
  rejectionReason?: string; // rejected cards reveal this behind a collapsible row
  onCancel?: () => void;
};

// Per-status treatment for the status pill — soft 50-tints so a mixed list
// stays calm; the small dot carries the strongest color.
const STATUS_STYLES: Record<
  RequestStatus,
  { pill: string; text: string; dot: string }
> = {
  Approved: {
    pill: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: '#059669',
  },
  Pending: {
    pill: 'bg-amber-50',
    text: 'text-amber-700',
    dot: '#D97706',
  },
  Rejected: {
    pill: 'bg-red-50',
    text: 'text-red-700',
    dot: '#DC2626',
  },
};

// A single leave-request row: neutral icon tile (ink on slate — no per-type
// color, matching the home page's monochrome card language), title and dates,
// a soft status pill, and a footer action — plain-text "Cancel leave" for
// active requests, or a collapsible "Rejection reason" for rejected ones.
export default function RequestCard({
  type,
  dates,
  days,
  status,
  icon: Icon,
  rejectionReason,
  onCancel,
}: RequestCardProps) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const s = STATUS_STYLES[status];
  const rejected = status === 'Rejected';
  const cancellable = !rejected && onCancel;

  return (
    <View
      style={cardShadow}
      className="rounded-3xl border border-slate-100 bg-white p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
          <Icon size={20} color="#14323F" strokeWidth={1.75} />
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
              hitSlop={8}
              className="flex-row items-center gap-1.5 active:opacity-60"
            >
              <X size={14} color="#EF4444" strokeWidth={2.5} />
              <Text className="text-[13px] font-bold text-red-500">
                Cancel leave
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {rejected && rejectionReason ? (
        <>
          <View className="mt-3 border-t border-slate-100" />
          <Pressable
            onPress={() => setReasonOpen((v) => !v)}
            hitSlop={8}
            className="mt-3 flex-row items-center justify-between active:opacity-60"
          >
            <Text className="text-[13px] font-bold text-slate-500">
              Rejection reason
            </Text>
            {reasonOpen ? (
              <ChevronUp size={16} color="#94A3B8" strokeWidth={2.25} />
            ) : (
              <ChevronDown size={16} color="#94A3B8" strokeWidth={2.25} />
            )}
          </Pressable>
          {reasonOpen ? (
            <View className="mt-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
              <Text className="text-[13px] leading-5 text-slate-600">
                {rejectionReason}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
