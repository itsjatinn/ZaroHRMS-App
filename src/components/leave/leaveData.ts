// Shared types, leave-balance data, and small date helpers for the
// Leave Application screen.

/**
 * A leave type's id. Free-form because types are configured per tenant and
 * arrive from /requests/settings — the old fixed union could not represent
 * whatever HR has set up.
 */
export type LeaveKey = string;

export type LeaveType = {
  key: LeaveKey;
  label: string; // e.g. "Annual Leave"
  short: string; // dropdown / balance label
  remaining: number; // days still available
  /** HR-configured rules. Optional so the demo list can omit them. */
  paid?: boolean;
  /** 0 or absent = no cap on a single stretch. */
  maxConsecutiveDays?: number;
  /** Counts intervening week-offs/holidays. Employees never receive this
   *  flag from the server, so it stays false client-side on both products. */
  sandwichRule?: boolean;
};

/** Offline demo fallback only — real types come from useApplicableLeaveTypes. */
export const LEAVE_TYPES: LeaveType[] = [
  { key: 'annual', label: 'Annual Leave', short: 'Annual', remaining: 6 },
  { key: 'sick', label: 'Sick Leave', short: 'Sick', remaining: 8 },
  { key: 'paternity', label: 'Paternity Leave', short: 'Paternity', remaining: 7 },
  { key: 'casual', label: 'Casual Leave', short: 'Casual', remaining: 10 },
];

export const DURATIONS = ['Full Day', 'Half Day'] as const;
export type Duration = (typeof DURATIONS)[number];

// dd/mm/yyyy
export function formatDate(d: Date | null): string {
  if (!d) return '';
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Strip the time component so day comparisons are stable.
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Inclusive number of days between two dates (1 when same day).
export function daysBetween(start: Date | null, end: Date | null): number {
  if (!start) return 0;
  if (!end) return 1;
  const ms = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.floor(ms / 86_400_000) + 1;
}
