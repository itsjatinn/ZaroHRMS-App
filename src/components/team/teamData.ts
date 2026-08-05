// Roster types, calendar styling and the offline demo set for the manager
// "My team" screens. Live sessions read the same endpoints as the web panel;
// the demo data below (pinned to July 2026) only renders when signed into the
// offline demo.
//
// Colors mirror the web panel's team calendars exactly
// (TeamAttendanceCalendar.css / TeamCalendar.css), so a status reads the same
// wherever a manager meets it.

export type TeamStatus =
  | 'Present'
  | 'Half day'
  | 'WFH/WO'
  | 'On leave'
  | 'Absent';

export type TeamMember = {
  /** Server employee id — the key the month/calendar endpoints take. */
  id: string;
  initials: string;
  name: string;
  role: string;
  employeeId: string;
  email: string;
  status: TeamStatus;
  inTime: string;
  outTime: string;
  note?: string;
};

export const TEAM: TeamMember[] = [
  { id: 'EMP-1042', initials: 'AS', name: 'Aarav Sharma', role: 'Senior Engineer', employeeId: 'EMP-1042', email: 'aarav.sharma@zarodemo.com', status: 'Present', inTime: '09:14 AM', outTime: '—' },
  { id: 'EMP-1088', initials: 'PN', name: 'Priya Nair', role: 'Product Designer', employeeId: 'EMP-1088', email: 'priya.nair@zarodemo.com', status: 'WFH/WO', inTime: '09:05 AM', outTime: '—' },
  { id: 'EMP-1103', initials: 'RV', name: 'Rohan Verma', role: 'QA Analyst', employeeId: 'EMP-1103', email: 'rohan.verma@zarodemo.com', status: 'On leave', inTime: '—', outTime: '—' },
  { id: 'EMP-1120', initials: 'MI', name: 'Meera Iyer', role: 'Engineer', employeeId: 'EMP-1120', email: 'meera.iyer@zarodemo.com', status: 'Present', inTime: '09:41 AM', outTime: '—', note: 'Late 11m' },
  { id: 'EMP-1156', initials: 'DR', name: 'Devansh Rao', role: 'DevOps Engineer', employeeId: 'EMP-1156', email: 'devansh.rao@zarodemo.com', status: 'Absent', inTime: '—', outTime: '—', note: 'No punch' },
  { id: 'EMP-1171', initials: 'AG', name: 'Ananya Gupta', role: 'Engineer', employeeId: 'EMP-1171', email: 'ananya.gupta@zarodemo.com', status: 'Present', inTime: '08:58 AM', outTime: '06:12 PM' },
];

export const STATUS_STYLE: Record<TeamStatus, { bg: string; text: string; dot: string }> = {
  Present: { bg: '#E7F4EC', text: '#347553', dot: '#4A9870' },
  'Half day': { bg: '#FFF2D8', text: '#946312', dot: '#D49A35' },
  'WFH/WO': { bg: '#E2F3F3', text: '#24777B', dot: '#2D8D91' },
  'On leave': { bg: '#F0EBF8', text: '#70549D', dot: '#8066AE' },
  Absent: { bg: '#FDEBEC', text: '#B54246', dot: '#D45155' },
};

/* --------------------------------- month ---------------------------------- */

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export type MonthGrid = {
  year: number;
  /** 1-12, matching the backend's month query param. */
  month: number;
  label: string;
  days: number[];
  /** Today's day-of-month when the cursor is on the current month. */
  todayDay: number | null;
  weekdayLetter: (day: number) => string;
  isWeekend: (day: number) => boolean;
};

/** Real-calendar month grid for the given cursor. */
export function monthGrid(year: number, month: number): MonthGrid {
  const dayCount = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrent = now.getFullYear() === year && now.getMonth() + 1 === month;
  return {
    year,
    month,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    days: Array.from({ length: dayCount }, (_, index) => index + 1),
    todayDay: isCurrent ? now.getDate() : null,
    weekdayLetter: (day) => WEEKDAY_LETTERS[new Date(year, month - 1, day).getDay()],
    isWeekend: (day) => {
      const weekday = new Date(year, month - 1, day).getDay();
      return weekday === 0 || weekday === 6;
    },
  };
}

/* ------------------------------- attendance ------------------------------- */

export type AttendanceCode =
  | 'P'
  /** Present, but punched in after shift start + grace. */
  | 'P_LATE'
  | 'A'
  /** Absent because the punch-OUT never came, not a no-show. */
  | 'A_MISSED'
  | 'L'
  | 'WFH'
  | 'OD'
  | 'CO'
  | 'HD'
  | 'WO'
  | 'H'
  | 'UP';

// Same palette as the web team attendance calendar (TeamAttendanceCalendar.css).
// `bg`/`text` are the pale CELL treatment; `dot` is the saturated LEGEND
// swatch — the web uses two different values for the same reason (a legend
// dot is 10px and washes out at cell opacity).
export const ATTENDANCE_STYLE: Record<
  AttendanceCode,
  { label: string; bg: string; text: string; dot: string; legend: string; ring?: string }
> = {
  P: { label: 'P', bg: '#E7F4EC', text: '#347553', dot: '#4A9870', legend: 'Present' },
  // Same Present green — the day is equally credited; the ring and the "*"
  // only say the arrival was late. Mirrors the A / A* pair below.
  P_LATE: {
    label: 'P*',
    bg: '#E7F4EC',
    text: '#347553',
    dot: '#4A9870',
    ring: '#14532D',
    legend: 'Present (late punch-in)',
  },
  A: { label: 'A', bg: '#FDEBEC', text: '#B54246', dot: '#D45155', legend: 'Absent' },
  // Same Absent red — the day is equally uncredited; the marker only says
  // WHY. "A*" is the muster-roll convention the HR reports also use, and
  // works where a dense mobile grid has no room for a tooltip. The legend
  // swatch carries a darker ring so it is not mistaken for plain Absent.
  A_MISSED: {
    label: 'A*',
    bg: '#FDEBEC',
    text: '#B54246',
    dot: '#D45155',
    ring: '#7F1D1D',
    legend: 'Absent (missed punch)',
  },
  L: { label: 'L', bg: '#F0EBF8', text: '#70549D', dot: '#8066AE', legend: 'On leave' },
  WFH: { label: 'WFH', bg: '#E2F3F3', text: '#24777B', dot: '#2D8D91', legend: 'Work from home' },
  OD: { label: 'OD', bg: '#E2F0F5', text: '#286A86', dot: '#337B9B', legend: 'On duty' },
  CO: { label: 'CO', bg: '#DFF4EF', text: '#0F766E', dot: '#0F9488', legend: 'Comp Off leave' },
  HD: { label: 'HD', bg: '#FFF2D8', text: '#946312', dot: '#D49A35', legend: 'Half day' },
  WO: { label: 'WO', bg: '#ECEEF1', text: '#69717D', dot: '#A7ADB8', legend: 'Weekly off' },
  H: { label: 'H', bg: '#E7F0FA', text: '#3C6F9F', dot: '#4D80B5', legend: 'Holiday' },
  // Days that haven't happened yet — an empty cell, not a status.
  UP: { label: '', bg: 'transparent', text: '#94A3B8', dot: '#CBD5E1', legend: 'Upcoming' },
};

export const ATTENDANCE_LEGEND: AttendanceCode[] = ['P', 'P_LATE', 'A', 'A_MISSED', 'L', 'WFH', 'OD', 'CO', 'HD', 'WO', 'H'];

/** Backend AttendanceStatus → cell code. Unknown statuses render empty. */
export function codeForStatus(
  status: string | undefined,
  missedPunch = false,
  late = false,
): AttendanceCode {
  switch (String(status ?? '').toUpperCase()) {
    case 'PRESENT':
      return late ? 'P_LATE' : 'P';
    case 'ABSENT':
      return missedPunch ? 'A_MISSED' : 'A';
    case 'LEAVE':
      return 'L';
    case 'WFH':
      return 'WFH';
    case 'ON_DUTY':
      return 'OD';
    case 'COMP_OFF_LEAVE':
      return 'CO';
    case 'HALF_DAY':
      return 'HD';
    case 'WO':
      return 'WO';
    case 'HOLIDAY':
      return 'H';
    default:
      return 'UP';
  }
}

/* ----------------------------- demo attendance ----------------------------- */

// Per-member exceptions on working days; everything else resolves to Present.
// Day-of-month keyed, so the demo grid stays plausible on any month.
const EXCEPTIONS: Record<string, Partial<Record<number, AttendanceCode>>> = {
  'EMP-1042': { 6: 'A', 7: 'WFH', 13: 'L', 14: 'L', 15: 'L', 20: 'HD' },
  'EMP-1088': { 1: 'WFH', 2: 'WFH', 8: 'A', 16: 'WFH', 23: 'WFH', 24: 'WFH' },
  'EMP-1103': { 9: 'HD', 10: 'A', 13: 'A', 14: 'A', 21: 'L', 22: 'L' },
  'EMP-1120': { 3: 'HD', 15: 'A', 16: 'HD', 27: 'WFH' },
  'EMP-1156': { 1: 'A', 2: 'A', 7: 'L', 8: 'L', 17: 'A', 28: 'HD' },
  'EMP-1171': { 6: 'WFH', 9: 'WFH', 20: 'L', 30: 'A' },
};

const DEMO_HOLIDAYS = [18];

export function demoAttendanceFor(grid: MonthGrid, employeeId: string, day: number): AttendanceCode {
  if (grid.todayDay != null && day > grid.todayDay) return 'UP';
  if (DEMO_HOLIDAYS.includes(day)) return 'H';
  if (grid.isWeekend(day)) return 'WO';
  return EXCEPTIONS[employeeId]?.[day] ?? 'P';
}

/* --------------------------------- leave ---------------------------------- */

export type LeaveState = 'approved' | 'pending' | 'rejected' | 'cancellation';

// Same bar colors as the web team leave calendar (TeamCalendar.css).
export const LEAVE_STYLE: Record<LeaveState, { fill: string; text: string; legend: string; dashed?: boolean }> = {
  approved: { fill: '#45966D', text: '#FFFFFF', legend: 'Approved leave' },
  pending: { fill: '#F0B429', text: '#2F2606', legend: 'Pending approval', dashed: true },
  rejected: { fill: '#D45155', text: '#FFFFFF', legend: 'Rejected leave' },
  cancellation: { fill: '#BDC1CC', text: '#2F2606', legend: 'Cancellation requested' },
};

export const LEAVE_LEGEND: LeaveState[] = ['approved', 'pending', 'rejected', 'cancellation'];

/** Backend LeaveStatus → bar state; null hides statuses the bar can't show. */
export function leaveStateFor(status: string | undefined): LeaveState | null {
  switch (String(status ?? '').toUpperCase()) {
    case 'APPROVED':
      return 'approved';
    case 'PENDING':
      return 'pending';
    case 'REJECTED':
      return 'rejected';
    case 'CANCELLATION_REQUESTED':
      return 'cancellation';
    default:
      return null;
  }
}

export type TeamLeave = {
  employeeId: string;
  start: number;
  end: number;
  label: string;
  state: LeaveState;
};

export const TEAM_LEAVES: TeamLeave[] = [
  { employeeId: 'EMP-1042', start: 13, end: 15, label: 'Casual', state: 'approved' },
  { employeeId: 'EMP-1042', start: 20, end: 20, label: 'Comp-off', state: 'pending' },
  { employeeId: 'EMP-1088', start: 6, end: 7, label: 'Earned', state: 'pending' },
  { employeeId: 'EMP-1103', start: 21, end: 22, label: 'Earned', state: 'approved' },
  { employeeId: 'EMP-1120', start: 9, end: 9, label: 'Sick', state: 'rejected' },
  { employeeId: 'EMP-1156', start: 7, end: 8, label: 'Casual', state: 'approved' },
  { employeeId: 'EMP-1156', start: 28, end: 29, label: 'Earned', state: 'cancellation' },
  { employeeId: 'EMP-1171', start: 20, end: 20, label: 'Sick', state: 'approved' },
];
