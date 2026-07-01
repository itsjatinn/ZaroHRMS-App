import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  MapPin,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';

type Status = 'present' | 'late' | 'absent' | 'wfh' | 'leave';

const STATUS_META: Record<
  Status,
  { label: string; color: string; badge: string; icon: LucideIcon }
> = {
  present: { label: 'Present', color: '#059669', badge: 'bg-emerald-100', icon: CircleCheck },
  late: { label: 'Late', color: '#D9A53B', badge: 'bg-amber-100', icon: Clock },
  absent: { label: 'Absent', color: '#E11D48', badge: 'bg-rose-100', icon: CircleX },
  wfh: { label: 'WFH', color: '#6B5FCF', badge: 'bg-violet-100', icon: MapPin },
  leave: { label: 'Leave', color: '#2563EB', badge: 'bg-blue-100', icon: CalendarDays },
};

const LOG: {
  date: string;
  in: string;
  out: string;
  hours: string;
  status: Status;
}[] = [
  { date: 'Fri, 19 Jun', in: '09:12 AM', out: '06:30 PM', hours: '8h 12m', status: 'present' },
  { date: 'Thu, 18 Jun', in: '09:48 AM', out: '06:35 PM', hours: '7h 47m', status: 'late' },
  { date: 'Wed, 17 Jun', in: '—', out: '—', hours: '—', status: 'leave' },
  { date: 'Tue, 16 Jun', in: '09:05 AM', out: '06:20 PM', hours: '8h 05m', status: 'present' },
  { date: 'Mon, 15 Jun', in: '09:00 AM', out: '02:00 PM', hours: '5h 00m', status: 'wfh' },
];

export default function AttendanceLog() {
  return (
    <View style={cardShadow} className="rounded-[24px] border border-slate-100 bg-white p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">Recent Activity</Text>
        <Pressable hitSlop={6} className="active:opacity-60">
          <Text className="text-xs font-semibold text-blue-600">View All</Text>
        </Pressable>
      </View>

      {/* Log rows */}
      <View className="mt-2">
        {LOG.map((item, i) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <Fragment key={item.date}>
              {i > 0 && <View className="border-b border-slate-100" />}
              <View className="flex-row items-center gap-3 py-3">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-xl ${meta.badge}`}
                >
                  <Icon size={16} color={meta.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink">{item.date}</Text>
                  <Text className="text-xs text-slate-400">
                    {item.in} – {item.out}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-ink">{item.hours}</Text>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </Text>
                </View>
              </View>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}
