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

/**
 * Counts a live month's day statuses into the summary grid's shape.
 *
 * "Working days" is present + absent + late + leave — the days that actually
 * carry a state. Holidays and week-offs are excluded so the percentage answers
 * "of the days I was expected, how many did I make?" rather than being diluted
 * by days nobody works.
 */
export function fromDayStatuses(statuses: Record<string, string>): MonthData {
  let present = 0;
  let absent = 0;
  let leave = 0;

  for (const status of Object.values(statuses)) {
    switch (status) {
      case 'present':
      case 'wfh':
        present += 1;
        break;
      case 'half':
        // A half day counts as attendance, but only half of one.
        present += 0.5;
        leave += 0.5;
        break;
      case 'absent':
        absent += 1;
        break;
      case 'applied':
      case 'approved':
      case 'compoff':
      case 'lop':
      case 'optional-claimed':
        leave += 1;
        break;
      default:
        // holiday, optional-pending, work-applied, today: not a worked day.
        break;
    }
  }

  // The calendar endpoint carries no late flag, so this stays 0 until a
  // late-arrival source is wired — better than inventing a number.
  const late = 0;
  return {
    present,
    absent,
    late,
    leave,
    working: present + absent + leave,
  };
}
