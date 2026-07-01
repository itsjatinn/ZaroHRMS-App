import {
  CalendarCheck,
  CalendarDays,
  CircleX,
  Clock,
} from 'lucide-react-native';

import type { GridStat } from './AttendanceStatGrid';

// Brighter status colors so they read on the dark ink cards.
const PRESENT = { icon: CalendarCheck, color: '#34D399', badge: 'bg-emerald-100' };
const ABSENT = { icon: CircleX, color: '#FB7185', badge: 'bg-rose-100' };
const LATE = { icon: Clock, color: '#F5D14E', badge: 'bg-amber-100' };
const LEAVE = { icon: CalendarDays, color: '#60A5FA', badge: 'bg-blue-100' };

export type MonthData = {
  present: number;
  absent: number;
  late: number;
  leave: number;
  working: number;
};

// Demo data keyed by "YYYY-M" (month 0-indexed).
const DATA: Record<string, MonthData> = {
  '2026-5': { present: 18, absent: 2, late: 3, leave: 1, working: 21 }, // Jun 2026
  '2026-4': { present: 20, absent: 1, late: 2, leave: 1, working: 22 }, // May
  '2026-6': { present: 12, absent: 0, late: 1, leave: 2, working: 15 }, // Jul (partial)
};

export function getMonthData(year: number, month: number): MonthData {
  return (
    DATA[`${year}-${month}`] ?? { present: 0, absent: 0, late: 0, leave: 0, working: 0 }
  );
}

export function toStats(d: MonthData): [GridStat, GridStat, GridStat, GridStat] {
  return [
    { label: 'Present', value: d.present, ...PRESENT },
    { label: 'Absent', value: d.absent, ...ABSENT },
    { label: 'Late', value: d.late, ...LATE },
    { label: 'Leave', value: d.leave, ...LEAVE },
  ];
}

export function toPercent(d: MonthData): number {
  if (d.working === 0) return 0;
  return Math.round((d.present / d.working) * 100);
}
