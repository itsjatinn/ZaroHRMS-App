// Demo roster + calendar data for the manager "My team" screens.
// Everything is pinned to July 2026 so the mock month lines up with the
// designs (1 Jul 2026 is a Wednesday).

export type TeamStatus = 'Present' | 'WFH/WO' | 'On leave' | 'Absent';

export type TeamMember = {
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
  { initials: 'AS', name: 'Aarav Sharma', role: 'Senior Engineer', employeeId: 'EMP-1042', email: 'aarav.sharma@zarodemo.com', status: 'Present', inTime: '09:14 AM', outTime: '—' },
  { initials: 'PN', name: 'Priya Nair', role: 'Product Designer', employeeId: 'EMP-1088', email: 'priya.nair@zarodemo.com', status: 'WFH/WO', inTime: '09:05 AM', outTime: '—' },
  { initials: 'RV', name: 'Rohan Verma', role: 'QA Analyst', employeeId: 'EMP-1103', email: 'rohan.verma@zarodemo.com', status: 'On leave', inTime: '—', outTime: '—' },
  { initials: 'MI', name: 'Meera Iyer', role: 'Engineer', employeeId: 'EMP-1120', email: 'meera.iyer@zarodemo.com', status: 'Present', inTime: '09:41 AM', outTime: '—', note: 'Late 11m' },
  { initials: 'DR', name: 'Devansh Rao', role: 'DevOps Engineer', employeeId: 'EMP-1156', email: 'devansh.rao@zarodemo.com', status: 'Absent', inTime: '—', outTime: '—', note: 'No punch' },
  { initials: 'AG', name: 'Ananya Gupta', role: 'Engineer', employeeId: 'EMP-1171', email: 'ananya.gupta@zarodemo.com', status: 'Present', inTime: '08:58 AM', outTime: '06:12 PM' },
];

export const STATUS_STYLE: Record<TeamStatus, { bg: string; text: string; dot: string }> = {
  Present: { bg: '#E8F5EF', text: '#2F7D5B', dot: '#50A47D' },
  'WFH/WO': { bg: '#EEEDFC', text: '#6258B2', dot: '#8177D2' },
  'On leave': { bg: '#FFF4D9', text: '#9B6A12', dot: '#D29A2E' },
  Absent: { bg: '#FDEBEC', text: '#B74853', dot: '#DF6470' },
};

export const MONTH_LABEL = 'July 2026';
export const DAYS_IN_MONTH = 31;
export const DAYS = Array.from({ length: DAYS_IN_MONTH }, (_, index) => index + 1);
export const TODAY = 17;
export const HOLIDAYS = [18];

// 1 Jul 2026 falls on a Wednesday.
const WEEKDAY_LETTERS = ['W', 'T', 'F', 'S', 'S', 'M', 'T'];
export const weekdayLetter = (day: number) => WEEKDAY_LETTERS[(day - 1) % 7];
export const isWeekend = (day: number) => (day - 1) % 7 === 3 || (day - 1) % 7 === 4;
export const isHoliday = (day: number) => HOLIDAYS.includes(day);

/* ------------------------------- attendance ------------------------------- */

export type AttendanceCode = 'P' | 'A' | 'L' | 'HD' | 'WFH' | 'WO' | 'H';

export const ATTENDANCE_STYLE: Record<AttendanceCode, { label: string; bg: string; text: string; legend: string }> = {
  P: { label: 'P', bg: '#E8F5EF', text: '#2F7D5B', legend: 'Present' },
  WFH: { label: 'WFH', bg: '#E9F3FA', text: '#2970A8', legend: 'Work from home' },
  HD: { label: 'HD', bg: '#FFF4D9', text: '#9B6A12', legend: 'Half day' },
  L: { label: 'L', bg: '#EEEDFC', text: '#6258B2', legend: 'On leave' },
  A: { label: 'A', bg: '#FDEBEC', text: '#B74853', legend: 'Absent' },
  WO: { label: 'WO', bg: '#F1F3F6', text: '#94A3B8', legend: 'Weekly off' },
  H: { label: 'H', bg: '#EEF5FA', text: '#5C90B4', legend: 'Holiday' },
};

export const ATTENDANCE_LEGEND: AttendanceCode[] = ['P', 'WFH', 'HD', 'L', 'A', 'WO', 'H'];

// Per-member exceptions on working days; everything else resolves to Present.
const EXCEPTIONS: Record<string, Partial<Record<number, AttendanceCode>>> = {
  'EMP-1042': { 6: 'A', 7: 'WFH', 13: 'L', 14: 'L', 15: 'L', 20: 'HD' },
  'EMP-1088': { 1: 'WFH', 2: 'WFH', 8: 'A', 16: 'WFH', 23: 'WFH', 24: 'WFH' },
  'EMP-1103': { 9: 'HD', 10: 'A', 13: 'A', 14: 'A', 21: 'L', 22: 'L' },
  'EMP-1120': { 3: 'HD', 15: 'A', 16: 'HD', 27: 'WFH' },
  'EMP-1156': { 1: 'A', 2: 'A', 7: 'L', 8: 'L', 17: 'A', 28: 'HD' },
  'EMP-1171': { 6: 'WFH', 9: 'WFH', 20: 'L', 30: 'A' },
};

export function attendanceFor(employeeId: string, day: number): AttendanceCode {
  if (isHoliday(day)) return 'H';
  if (isWeekend(day)) return 'WO';
  return EXCEPTIONS[employeeId]?.[day] ?? 'P';
}

// Attendance score = credited days / working days. Half days count as 0.5;
// leave, weekly off and holidays are excluded from the denominator.
export function attendanceScore(employeeId: string) {
  let worked = 0;
  let credit = 0;
  let absent = 0;
  for (const day of DAYS) {
    const code = attendanceFor(employeeId, day);
    if (code === 'WO' || code === 'H' || code === 'L') continue;
    worked += 1;
    if (code === 'P' || code === 'WFH') credit += 1;
    else if (code === 'HD') credit += 0.5;
    else absent += 1;
  }
  return { percent: worked ? Math.round((credit / worked) * 100) : 0, absent };
}

export function attendanceTotals() {
  let present = 0;
  let absent = 0;
  let half = 0;
  let working = 0;
  for (const member of TEAM) {
    for (const day of DAYS) {
      const code = attendanceFor(member.employeeId, day);
      if (code === 'WO' || code === 'H' || code === 'L') continue;
      working += 1;
      if (code === 'P' || code === 'WFH') present += 1;
      else if (code === 'HD') half += 1;
      else absent += 1;
    }
  }
  return {
    percent: working ? Math.round(((present + half * 0.5) / working) * 100) : 0,
    present,
    absent,
    half,
  };
}

/* --------------------------------- leave ---------------------------------- */

export type LeaveState = 'approved' | 'pending' | 'rejected' | 'cancellation';

export const LEAVE_STYLE: Record<LeaveState, { fill: string; text: string; legend: string; dashed?: boolean }> = {
  approved: { fill: '#2F7D5B', text: '#FFFFFF', legend: 'Approved leave' },
  pending: { fill: '#F5B921', text: '#5C4308', legend: 'Pending approval', dashed: true },
  rejected: { fill: '#DF6470', text: '#FFFFFF', legend: 'Rejected leave' },
  cancellation: { fill: '#AAB2C0', text: '#FFFFFF', legend: 'Cancellation requested' },
};

export const LEAVE_LEGEND: LeaveState[] = ['approved', 'pending', 'rejected', 'cancellation'];

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

// Approved head-count out of office per day — drives the summary strip.
export function approvedOnLeave(day: number) {
  return TEAM_LEAVES.filter(
    (leave) => leave.state === 'approved' && day >= leave.start && day <= leave.end,
  ).length;
}
