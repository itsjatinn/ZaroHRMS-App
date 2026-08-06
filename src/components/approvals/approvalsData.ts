export type ApprovalType =
  | 'Leave'
  | 'Regularize'
  | 'Comp-off'
  | 'Optional holiday'
  | 'WFH / On duty'
  | 'Other';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

// A colleague already off (or asking to be off) during the same window as the
// request under review — surfaced so the manager can spot coverage gaps.
export type Overlap = {
  name: string;
  role: string;
  period: string;
  leaveType: string;
  state: 'Approved' | 'Also requested';
};

export type Approval = {
  id: string;
  employee: string;
  initials: string;
  role: string;
  employeeId: string;
  type: ApprovalType;
  title: string;
  from: string;
  to: string;
  days: number;
  submitted: string;
  reason: string;
  stage: string;
  stageNote: string;
  status: ApprovalStatus;
  overlaps: Overlap[];
  /** The approval step lapsed past its window. Shown as a chip; the note
   *  explains which step and why, without naming an actor. */
  overdue?: boolean;
  overdueNote?: string;
};

export const INITIAL_APPROVALS: Approval[] = [
  {
    id: 'APR-1048',
    employee: 'Aarav Sharma',
    initials: 'AS',
    role: 'Senior Engineer',
    employeeId: 'EMP-1042',
    type: 'Leave',
    title: 'Sick Leave',
    from: '2026-07-15',
    to: '2026-07-16',
    days: 2,
    submitted: 'Just now',
    reason: 'Down with a viral fever, doctor advised two days of rest. | Session: full to full',
    stage: 'Manager approval',
    stageNote: 'Approval completes this request.',
    status: 'Pending',
    overlaps: [
      { name: 'Vikram K.', role: 'Engineer II', period: '11 Jul – 13 Jul', leaveType: 'Casual', state: 'Approved' },
      { name: 'Sanjay K.', role: 'Engineer II', period: '12 Jul', leaveType: 'Sick', state: 'Also requested' },
    ],
  },
  {
    id: 'APR-1047',
    employee: 'Priya Nair',
    initials: 'PN',
    role: 'Product Designer',
    employeeId: 'EMP-1088',
    type: 'Leave',
    title: 'Earned Leave',
    from: '2026-07-20',
    to: '2026-07-22',
    days: 3,
    submitted: 'Today, 10:42 AM',
    reason: 'Family function out of station. | Session: full to full',
    stage: 'Manager approval',
    stageNote: 'HR review follows your approval.',
    status: 'Pending',
    overlaps: [
      { name: 'Aarav Sharma', role: 'Senior Engineer', period: '20 Jul', leaveType: 'Comp-off', state: 'Also requested' },
    ],
  },
  {
    id: 'APR-1046',
    employee: 'Devansh Rao',
    initials: 'DR',
    role: 'DevOps Engineer',
    employeeId: 'EMP-1156',
    type: 'Regularize',
    title: 'Missed punch',
    from: '2026-07-13',
    to: '2026-07-13',
    days: 1,
    submitted: 'Today, 09:18 AM',
    reason: 'Forgot to check out after the client call. | Actual: 09:12 AM – 06:26 PM',
    stage: 'Manager approval',
    stageNote: 'Approval completes this request.',
    status: 'Pending',
    overlaps: [],
  },
  {
    id: 'APR-1045',
    employee: 'Ananya Gupta',
    initials: 'AG',
    role: 'Engineer',
    employeeId: 'EMP-1171',
    type: 'Comp-off',
    title: 'Comp-off credit',
    from: '2026-07-11',
    to: '2026-07-11',
    days: 1,
    submitted: 'Yesterday, 01:20 PM',
    reason: 'Worked the Saturday release window. | Session: full day',
    stage: 'Manager approval',
    stageNote: 'Credit is added to the balance on approval.',
    status: 'Pending',
    overlaps: [],
  },
  {
    id: 'APR-1044',
    employee: 'Meera Iyer',
    initials: 'MI',
    role: 'Engineer',
    employeeId: 'EMP-1120',
    type: 'Optional holiday',
    title: 'Optional holiday',
    from: '2026-07-09',
    to: '2026-07-09',
    days: 1,
    submitted: '08 Jul, 08:15 AM',
    reason: 'Opting for the regional festival holiday.',
    stage: 'Manager approval',
    stageNote: 'Approval completes this request.',
    status: 'Approved',
    overlaps: [],
  },
  {
    id: 'APR-1043',
    employee: 'Rohan Verma',
    initials: 'RV',
    role: 'QA Analyst',
    employeeId: 'EMP-1103',
    type: 'Regularize',
    title: 'Wrong check-in',
    from: '2026-07-06',
    to: '2026-07-06',
    days: 1,
    submitted: '06 Jul, 06:40 PM',
    reason: 'Incorrect punch captured by the device. | Actual: 08:56 AM – 06:08 PM',
    stage: 'Manager approval',
    stageNote: 'Approval completes this request.',
    status: 'Rejected',
    overlaps: [],
  },
];

export const TYPE_FILTERS = [
  'All types',
  'Leave',
  'Regularize',
  'Comp-off',
  'Optional holiday',
  'WFH / On duty',
] as const;
export const STATUS_FILTERS = ['Pending', 'Approved', 'Rejected', 'All'] as const;

export const TYPE_STYLE: Record<ApprovalType, { color: string; background: string; icon: string }> = {
  Leave: { color: '#A16D13', background: '#FFF3D6', icon: 'calendar' },
  Regularize: { color: '#645CB5', background: '#EFEEFC', icon: 'edit-3' },
  'Comp-off': { color: '#2970A8', background: '#E9F3FA', icon: 'refresh-cw' },
  'Optional holiday': { color: '#2F7D5B', background: '#E8F5EF', icon: 'sun' },
  'WFH / On duty': { color: '#0E7DB3', background: '#D7EEFB', icon: 'home' },
  Other: { color: '#475467', background: '#EDF0F3', icon: 'file-text' },
};

export const STATUS_STYLE: Record<ApprovalStatus, { bg: string; text: string }> = {
  Pending: { bg: '#FFF4D9', text: '#9B6A12' },
  Approved: { bg: '#E8F5EF', text: '#2F7D5B' },
  Rejected: { bg: '#FDEBEC', text: '#B74853' },
};

/* ------------------------------ delegation -------------------------------- */

export type Delegation = {
  id: string;
  delegate: string;
  start: string;
  end: string;
  reason?: string;
  state: 'Active' | 'Scheduled' | 'Revoked';
};

export const INITIAL_DELEGATIONS: Delegation[] = [
  { id: 'DEL-02', delegate: 'Aarav Sharma', start: '13/07/2026', end: '16/07/2026', reason: 'Annual leave', state: 'Revoked' },
];

// Colleagues who can hold the approval queue while the manager is away.
export const DELEGATE_OPTIONS = [
  { name: 'Aarav Sharma', employeeId: 'EMP-1042', email: 'aarav.sharma@zarodemo.com' },
  { name: 'Priya Nair', employeeId: 'EMP-1088', email: 'priya.nair@zarodemo.com' },
  { name: 'Rohan Verma', employeeId: 'EMP-1103', email: 'rohan.verma@zarodemo.com' },
  { name: 'Meera Iyer', employeeId: 'EMP-1120', email: 'meera.iyer@zarodemo.com' },
  { name: 'Ananya Gupta', employeeId: 'EMP-1171', email: 'ananya.gupta@zarodemo.com' },
];

export const DELEGATION_STATE_STYLE: Record<Delegation['state'], { bg: string; text: string }> = {
  Active: { bg: '#E8F5EF', text: '#2F7D5B' },
  Scheduled: { bg: '#E9F3FA', text: '#2970A8' },
  Revoked: { bg: '#FDEBEC', text: '#B74853' },
};

// ---- Live-queue adapter ----------------------------------------------------

import type { ServerApprovalKind, ServerApprovalRow } from '../../api/approvals';

const KIND_TO_TYPE: Record<string, ApprovalType> = {
  leave: 'Leave',
  cancellation: 'Leave',
  regularize: 'Regularize',
  compoff: 'Comp-off',
  optholiday: 'Optional holiday',
  wfh: 'WFH / On duty',
  od: 'WFH / On duty',
};

const KIND_TITLE: Partial<Record<string, string>> = {
  cancellation: 'Leave cancellation',
  optholiday: 'Optional holiday claim',
  overtime: 'Overtime',
  shiftswap: 'Shift swap',
};

function relativeLabel(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function metaValue(row: ServerApprovalRow, label: string): string | undefined {
  return row.meta?.find(
    (chip) => chip.label.trim().toLowerCase() === label,
  )?.value;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** What approving does, named for the approver reading it. */
function stageLabel(row: ServerApprovalRow): string {
  if (row.autoApproved) return 'Auto-approved';
  if (row.route === 'manager_then_hr') return 'HR step next';
  if (row.route === 'policy_exception') return 'Policy exception';
  return 'Manager approval';
}

/**
 * Short label for the request — "Annual Leave", "Comp-off credit",
 * "Milad-un-Nabi".
 *
 * NOT `summary`: that is already "Annual Leave · 2 days · 2026-07-24 to
 * 2026-07-25", and the card appends its own "· N days · from to to", so using
 * it printed every date and day count twice. The feed's own Type/Holiday meta
 * chip is the short form. KIND_TITLE stays as the last resort for the kinds
 * that publish neither.
 */
function shortTitle(row: ServerApprovalRow, kind: ServerApprovalKind): string {
  return (
    metaValue(row, 'type') ??
    metaValue(row, 'holiday') ??
    KIND_TITLE[kind] ??
    'Request'
  );
}

/**
 * Maps one server queue row onto the card model this screen renders. Dates and
 * day counts travel in the row's generic meta chips, so they are best-effort:
 * a kind without them falls back to em dashes rather than inventing values.
 */
export function toApproval(
  row: ServerApprovalRow,
  status: ApprovalStatus,
): Approval & { serverRow: ServerApprovalRow } {
  const kind = String(row.kind ?? '') as ServerApprovalKind;
  const name = row.requester?.name?.trim() || 'Employee';
  // `team` and `department` are the same department name on the kinds that
  // send both — dedupe, or the role line reads "Engineering · Engineering".
  const roleBits = Array.from(
    new Set(
      [
        row.requester?.designation,
        row.requester?.team,
        row.requester?.department,
      ].filter(Boolean),
    ),
  );
  const days = Number(metaValue(row, 'days') ?? metaValue(row, 'day count'));

  return {
    id: row.id,
    employee: name,
    initials: initialsOf(name),
    role: roleBits.join(' · '),
    employeeId: row.requester?.id ?? '',
    type: KIND_TO_TYPE[kind] ?? 'Other',
    title: shortTitle(row, kind),
    from: metaValue(row, 'from') ?? metaValue(row, 'date') ?? '—',
    to: metaValue(row, 'to') ?? metaValue(row, 'date') ?? '—',
    days: Number.isFinite(days) ? days : 0,
    submitted: relativeLabel(row.raisedAt),
    reason: row.details || row.summary || '',
    stage: stageLabel(row),
    // The server states what approving does per route and per kind ("Final
    // approval step — approving completes this request", "…waiting on the
    // next approver"). The old hardcoded line claimed the decision was final
    // even when an HR step followed.
    stageNote: row.autoApproved
      ? 'Approved automatically by policy.'
      : row.decisionNote
        ? `Note: ${row.decisionNote}`
        : (row.routeNote ?? 'Your decision completes this request.'),
    status,
    overdue: Boolean(row.escalation?.at),
    overdueNote: row.escalation?.at
      ? `${row.escalation.stepLabel ?? 'This'} step · ${
          row.escalation.reason ?? 'Pending beyond the approval window.'
        }`
      : undefined,
    // Cross-team overlap needs GET /requests/:id/team-overlap per row — not
    // fetched yet, so the coverage panel stays empty on live data.
    overlaps: [],
    serverRow: row,
  };
}
