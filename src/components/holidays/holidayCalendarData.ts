// Holiday calendar data + helpers — mirrors the web panel's Holiday Calendar
// (sidebar → Holiday). Mock data until /api/requests/calendar lands.

export type HolidayType = 'national' | 'state' | 'optional' | 'company';

/** Optional holidays only: where the employee stands on claiming the day. */
export type ClaimStatus = 'open' | 'approved' | 'pending' | 'closed';

export type CalendarHoliday = {
  id: string;
  name: string;
  /** ISO date — yyyy-mm-dd, all-day. */
  date: string;
  type: HolidayType;
  claim?: ClaimStatus;
  /** Backend id of an active optional-holiday claim, when there is one. */
  claimId?: string | null;
};

export const HOLIDAY_YEAR = 2026;

/** Optional holidays an employee may claim in a calendar year. */
export const OPTIONAL_QUOTA = 2;

/** HR setting: when false, claims route to the reporting manager / HR. */
export const OPTIONAL_AUTO_APPROVE = false;

// Type → label + accent colour, matching the web calendar pills and list chips
// one-to-one so both surfaces read the same.
export const TYPE_META: Record<
  HolidayType,
  { label: string; color: string; bg: string }
> = {
  national: { label: 'National', color: '#0F3D50', bg: '#E7EDF0' },
  state: { label: 'State', color: '#3A80E9', bg: '#E8F0FD' },
  optional: { label: 'Optional', color: '#7C5CC6', bg: '#F0EAFB' },
  company: { label: 'Company', color: '#C98A1A', bg: '#FBF0DA' },
};

/** Claim-state accents — the web uses these for both the pill and the chip. */
export const APPROVED_COLOR = '#3F7B58';
export const PENDING_COLOR = '#A37526';
export const WEEK_OFF_COLOR = '#94A3B8';

export const CLAIM_META: Record<ClaimStatus, { label: string; color: string }> = {
  open: { label: 'Claim open', color: '#7C5CC6' },
  approved: { label: 'Approved leave', color: APPROVED_COLOR },
  pending: { label: 'Awaiting approval', color: PENDING_COLOR },
  closed: { label: 'Claim closed', color: '#94A3B8' },
};

export const HOLIDAYS: CalendarHoliday[] = [
  { id: 'republic-day', name: 'Republic Day', date: '2026-01-26', type: 'national' },
  { id: 'maha-shivratri', name: 'Maha Shivratri', date: '2026-02-15', type: 'state' },
  { id: 'holi', name: 'Holi', date: '2026-03-04', type: 'state' },
  { id: 'gudi-padwa', name: 'Gudi Padwa', date: '2026-03-19', type: 'state' },
  { id: 'eid-al-fitr', name: 'Eid al-Fitr', date: '2026-03-21', type: 'state' },
  { id: 'ram-navami', name: 'Ram Navami', date: '2026-03-26', type: 'optional', claim: 'closed' },
  { id: 'mahavir-jayanti', name: 'Mahavir Jayanti', date: '2026-03-31', type: 'optional', claim: 'closed' },
  { id: 'good-friday', name: 'Good Friday', date: '2026-04-03', type: 'state' },
  { id: 'buddha-purnima', name: 'Buddha Purnima', date: '2026-05-01', type: 'optional', claim: 'closed' },
  { id: 'eid-al-adha', name: 'Eid al-Adha (Bakrid)', date: '2026-05-27', type: 'state' },
  { id: 'muharram', name: 'Muharram', date: '2026-06-16', type: 'optional', claim: 'closed' },
  { id: 'foundation-day', name: 'Company Foundation Day', date: '2026-07-01', type: 'company' },
  { id: 'independence-day', name: 'Independence Day', date: '2026-08-15', type: 'national' },
  { id: 'milad-un-nabi', name: 'Milad-un-Nabi', date: '2026-08-26', type: 'optional', claim: 'approved' },
  { id: 'raksha-bandhan', name: 'Raksha Bandhan', date: '2026-08-28', type: 'optional', claim: 'open' },
  { id: 'janmashtami', name: 'Janmashtami', date: '2026-09-04', type: 'state' },
  { id: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'state' },
  { id: 'anant-chaturdashi', name: 'Anant Chaturdashi (Ganesh Visarjan)', date: '2026-09-23', type: 'optional', claim: 'open' },
  { id: 'gandhi-jayanti', name: 'Gandhi Jayanti', date: '2026-10-02', type: 'national' },
  { id: 'dussehra', name: 'Dussehra (Vijayadashami)', date: '2026-10-20', type: 'state' },
  { id: 'diwali', name: 'Diwali (Lakshmi Puja)', date: '2026-11-08', type: 'state' },
  { id: 'govardhan-puja', name: 'Govardhan Puja', date: '2026-11-09', type: 'state' },
  { id: 'bhai-dooj', name: 'Bhai Dooj', date: '2026-11-10', type: 'optional', claim: 'open' },
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WEEKDAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** Parses yyyy-mm-dd as a local date — `new Date(iso)` would shift to UTC. */
export function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayNumber(iso: string) {
  return String(parseDate(iso).getDate());
}

export function monthShort(iso: string) {
  return MONTHS_SHORT[parseDate(iso).getMonth()];
}

export function weekdayShort(iso: string) {
  return WEEKDAY_SHORT[parseDate(iso).getDay()];
}

export function weekdayLong(iso: string) {
  return WEEKDAYS_LONG[parseDate(iso).getDay()];
}

export function fullDate(iso: string) {
  return parseDate(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isPast(iso: string, today = startOfToday()) {
  return parseDate(iso).getTime() < today.getTime();
}

/** Weekly off. The web resolves this per employee (override → role → org);
 *  until that config reaches the app we fall back to Saturday/Sunday. */
export function isWeekOff(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Whole days from today — negative once the holiday is behind us. */
export function daysAway(iso: string, today = startOfToday()) {
  const ms = parseDate(iso).getTime() - today.getTime();
  return Math.round(ms / 86_400_000);
}

export function countdownLabel(iso: string, today = startOfToday()) {
  const days = daysAway(iso, today);
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  return `IN ${days} DAYS`;
}

/** Accent a holiday carries on the calendar — an active claim outranks the
 *  holiday type, exactly like the web calendar's day pill. */
export function accentColor(holiday: CalendarHoliday) {
  if (holiday.type !== 'optional') return TYPE_META[holiday.type].color;
  if (holiday.claim === 'approved') return APPROVED_COLOR;
  if (holiday.claim === 'pending') return PENDING_COLOR;
  return TYPE_META.optional.color;
}

export type ClaimAction = 'claim' | 'withdraw' | 'cancel';

export type ClaimActionSpec = {
  label: string;
  /** null → nothing to do, render as static text (e.g. "Claim closed"). */
  action: ClaimAction | null;
  tone: 'primary' | 'ghost' | 'muted';
  disabled?: boolean;
};

/** The claim control a row/day shows. Null for non-claimable holidays. */
export function claimActionFor(
  holiday: CalendarHoliday,
  remaining: number,
  today = startOfToday(),
): ClaimActionSpec | null {
  if (holiday.type !== 'optional') return null;
  if (isPast(holiday.date, today)) {
    return { label: 'Claim closed', action: null, tone: 'muted' };
  }
  if (holiday.claim === 'approved') {
    return { label: 'Cancel approved leave', action: 'cancel', tone: 'ghost' };
  }
  if (holiday.claim === 'pending') {
    return { label: 'Withdraw request', action: 'withdraw', tone: 'ghost' };
  }
  if (remaining <= 0) {
    return { label: 'No claims left', action: null, tone: 'primary', disabled: true };
  }
  return { label: 'Claim holiday', action: 'claim', tone: 'primary' };
}

/** One-line explanation shown beside a claim control. */
export function claimStatusHint(
  holiday: CalendarHoliday,
  today = startOfToday(),
) {
  if (isPast(holiday.date, today)) {
    return 'This date has passed, so it can no longer be claimed.';
  }
  if (holiday.claim === 'pending') return 'Your claim is waiting for approval.';
  if (holiday.claim === 'approved') return 'Your optional leave is approved.';
  return 'Available to claim.';
}
