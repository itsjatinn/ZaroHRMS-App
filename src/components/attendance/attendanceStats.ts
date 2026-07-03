import {
  CalendarCheck,
  CalendarDays,
  Clock,
  LogOut,
  Sun,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type Stat = {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  badge: string; // pastel badge bg
};

export type RangeKey = 'this-month' | 'last-month' | 'this-year';

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'this-year', label: 'This Year' },
];

// Builds the 5 orbiting stats for a given set of counts.
function makeStats(present: number, absent: number, leave: number, late: number, half: number): Stat[] {
  return [
    { key: 'present', label: 'Present', value: present, icon: CalendarCheck, color: '#059669', badge: 'bg-emerald-100' },
    { key: 'absent', label: 'Absent', value: absent, icon: LogOut, color: '#E11D48', badge: 'bg-rose-100' },
    { key: 'leave', label: 'Leave', value: leave, icon: CalendarDays, color: '#D9A53B', badge: 'bg-amber-100' },
    { key: 'late', label: 'Late', value: late, icon: Clock, color: '#6B5FCF', badge: 'bg-violet-100' },
    { key: 'half', label: 'Half Day', value: half, icon: Sun, color: '#2563EB', badge: 'bg-blue-100' },
  ];
}

// Demo datasets per range.
export const STATS_BY_RANGE: Record<RangeKey, Stat[]> = {
  'this-month': makeStats(21, 1, 2, 3, 1),
  'last-month': makeStats(20, 2, 1, 2, 0),
  'this-year': makeStats(232, 9, 14, 21, 6),
};

// Overall attendance % = present / (present + absent + leave), half counts as 0.5.
export function attendancePercent(stats: Stat[]): number {
  const get = (k: string) => stats.find((s) => s.key === k)?.value ?? 0;
  const present = get('present') + get('half') * 0.5;
  const total = get('present') + get('absent') + get('leave') + get('half');
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}
