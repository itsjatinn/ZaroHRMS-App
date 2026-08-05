/**
 * Why a day on a picker is called out: it is not a working day, or the
 * employee already has something booked on it. Applying for leave over a
 * holiday or a day already requested is the most common wasted submission, so
 * the picker says so before the form does.
 */
export type DayMarkerKind =
  | 'week-off'
  | 'holiday'
  | 'optional-holiday'
  | 'pending-leave'
  | 'approved-leave'
  | 'absent';

export const DAY_MARKER_STYLE: Record<
  DayMarkerKind,
  { label: string; dot: string; bg: string; text: string }
> = {
  'week-off': {
    label: 'Week off',
    dot: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.20)',
    text: '#475569',
  },
  holiday: {
    label: 'Holiday',
    dot: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.18)',
    text: '#1D4ED8',
  },
  'optional-holiday': {
    label: 'Optional holiday',
    dot: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.18)',
    text: '#6D28D9',
  },
  'pending-leave': {
    label: 'Pending leave',
    dot: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.18)',
    text: '#B91C1C',
  },
  'approved-leave': {
    label: 'Approved leave',
    dot: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.20)',
    text: '#15803D',
  },
  absent: {
    label: 'Absent',
    // The same red the attendance grid marks an absence with, so the two
    // screens agree on what the colour means.
    dot: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.20)',
    text: '#B91C1C',
  },
};

/**
 * Which keys a picker shows. Deliberately per-screen: a legend listing states
 * that screen can never produce is noise, and "Absent" on the leave form or
 * "Approved leave" on the regularize form would both be exactly that.
 */
export const LEAVE_DAY_MARKERS: DayMarkerKind[] = [
  'week-off',
  'holiday',
  'optional-holiday',
  'pending-leave',
  'approved-leave',
];

export const REGULARIZE_DAY_MARKERS: DayMarkerKind[] = [
  'week-off',
  'holiday',
  'optional-holiday',
  'absent',
];

/**
 * WFH / On Duty. Non-working days only: those are what make a request
 * pointless. Leave statuses are deliberately absent — a WFH request is not
 * leave, so showing leave keys here would imply a relationship that is not
 * enforced.
 */
export const WORK_REQUEST_DAY_MARKERS: DayMarkerKind[] = [
  'week-off',
  'holiday',
  'optional-holiday',
];

/**
 * `yyyy-mm-dd` from local date parts. Built from the parts rather than
 * toISOString, which converts to UTC and lands on the previous day for
 * anything east of Greenwich after ~18:30 IST.
 */
export function dayMarkerKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
