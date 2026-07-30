export type ApprovalType = 'Leave' | 'Regularize' | 'Comp-off' | 'Optional holiday';
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

export const TYPE_FILTERS = ['All types', 'Leave', 'Regularize', 'Comp-off', 'Optional holiday'] as const;
export const STATUS_FILTERS = ['Pending', 'Approved', 'Rejected', 'All'] as const;

export const TYPE_STYLE: Record<ApprovalType, { color: string; background: string; icon: string }> = {
  Leave: { color: '#A16D13', background: '#FFF3D6', icon: 'calendar' },
  Regularize: { color: '#645CB5', background: '#EFEEFC', icon: 'edit-3' },
  'Comp-off': { color: '#2970A8', background: '#E9F3FA', icon: 'refresh-cw' },
  'Optional holiday': { color: '#2F7D5B', background: '#E8F5EF', icon: 'sun' },
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
