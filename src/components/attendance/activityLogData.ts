import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  MapPin,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

// Shared by the attendance page's "Recent Activity" card and the full
// Activity Log screen, so both render the same days the same way.

export type LogStatus = 'present' | 'late' | 'absent' | 'wfh' | 'leave';

export const STATUS_META: Record<
  LogStatus,
  { label: string; color: string; badge: string; icon: LucideIcon }
> = {
  present: { label: 'Present', color: '#059669', badge: 'bg-emerald-100', icon: CircleCheck },
  late: { label: 'Late', color: '#D9A53B', badge: 'bg-amber-100', icon: Clock },
  absent: { label: 'Absent', color: '#E11D48', badge: 'bg-rose-100', icon: CircleX },
  wfh: { label: 'WFH', color: '#6B5FCF', badge: 'bg-violet-100', icon: MapPin },
  leave: { label: 'Leave', color: '#2563EB', badge: 'bg-blue-100', icon: CalendarDays },
};

export type LogEntry = {
  day: number;
  /** YYYY-MM-DD — used to prefill the regularize form from an absent row. */
  iso: string;
  /** Display label, e.g. "Fri, 19 Jun". */
  date: string;
  in: string;
  out: string;
  hours: string;
  status: LogStatus;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// June 2026 — the app's demo month, hand-authored so the story matches the
// attendance calendar (absences early in the month, a couple of lates, a WFH).
const JUNE_2026: Record<number, LogStatus> = {
  1: 'absent',
  2: 'absent',
  5: 'absent',
  9: 'late',
  12: 'leave',
  15: 'wfh',
  17: 'leave',
  18: 'late',
  24: 'late',
};

/** Deterministic punch times so the demo rows vary a little day to day. */
function timesFor(status: LogStatus, day: number) {
  if (status === 'absent' || status === 'leave') {
    return { in: '—', out: '—', hours: '—' };
  }
  if (status === 'late') {
    return { in: '09:48 AM', out: '06:35 PM', hours: '7h 47m' };
  }
  if (status === 'wfh') {
    return { in: '09:00 AM', out: '05:30 PM', hours: '7h 30m' };
  }
  const minute = String(2 + (day % 8)).padStart(2, '0');
  return { in: `09:${minute} AM`, out: '06:20 PM', hours: '8h 05m' };
}

function statusFor(year: number, month: number, day: number): LogStatus {
  if (year === 2026 && month === 5) return JUNE_2026[day] ?? 'present';
  // Other months: mostly present, with a deterministic sprinkle of every
  // other status so the log (and its filters) always have variety.
  if (day % 13 === 0) return 'absent';
  if (day % 9 === 0) return 'late';
  if (day % 16 === 0) return 'wfh';
  if (day % 23 === 0) return 'leave';
  return 'present';
}

/**
 * Working-day log for a month (Mon–Fri only), newest first. Days after the
 * real today are excluded so the current month reads as a partial log.
 */
export function getMonthLog(year: number, month: number): LogEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const entries: LogEntry[] = [];

  for (let day = daysInMonth; day >= 1; day--) {
    const date = new Date(year, month, day);
    if (date > today) continue;
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) continue;

    const status = statusFor(year, month, day);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    entries.push({
      day,
      iso: `${year}-${mm}-${dd}`,
      date: `${WEEKDAYS[weekday]}, ${day} ${MONTHS_SHORT[month]}`,
      status,
      ...timesFor(status, day),
    });
  }

  return entries;
}

/** The most recent N working-day entries, walking back across months. */
export function getRecentLog(count: number): LogEntry[] {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  const out: LogEntry[] = [];

  // Two months is always enough to fill a short "recent" list.
  for (let i = 0; i < 2 && out.length < count; i++) {
    out.push(...getMonthLog(year, month));
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return out.slice(0, count);
}
