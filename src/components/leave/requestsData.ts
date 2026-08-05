import {
  Activity,
  Baby,
  CalendarDays,
  Plane,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';

import type { RequestAttachment } from '../../api/leave';
import type { RequestStatus } from './RequestCard';

export type Request = {
  id: string;
  /** LEAVE | WFH | OD | REGULARIZATION — drives the cancel wording. */
  category?: string;
  type: string;
  /** Why it was raised. Blank when none was given. */
  reason?: string;
  /** "31 Jul 2026" — when it was submitted. */
  appliedOn?: string;
  /** "31 Jul 2026" — when it was approved or rejected; blank while pending. */
  actionDate?: string;
  dates: string;
  days: string;
  month: string; // section header on the "All requests" screen, e.g. "August 2026"
  status: RequestStatus;
  icon: LucideIcon;
  rejectionReason?: string; // shown collapsibly on rejected cards
  /** Proof files, positionally indexed by the download endpoint. */
  attachments?: RequestAttachment[];
};

// Shared leave-request feed used by the Leave overview and the "All requests"
// screen. Ordered newest-first. Icons render ink-on-slate in RequestCard, so
// no per-item color is carried here.
export const REQUESTS: Request[] = [
  {
    id: '3',
    type: 'Paternity Leave',
    dates: '01 – 10 Sep 2026',
    days: '10 days',
    month: 'September 2026',
    status: 'Approved',
    icon: Baby,
  },
  {
    id: '1',
    type: 'Annual Leave',
    dates: '12 – 14 Aug 2026',
    days: '3 days',
    month: 'August 2026',
    status: 'Approved',
    icon: CalendarDays,
  },
  {
    id: '2',
    type: 'Sick Leave',
    dates: '28 Jul 2026',
    days: '1 day',
    month: 'July 2026',
    status: 'Pending',
    icon: Activity,
  },
  {
    id: '4',
    type: 'Casual Leave',
    dates: '19 Jun 2026',
    days: '1 day',
    month: 'June 2026',
    status: 'Rejected',
    icon: Sun,
    rejectionReason:
      'Insufficient casual leave balance for the selected date. Rejected by Riya Mehta (HR).',
  },
  {
    id: '5',
    type: 'Annual Leave',
    dates: '02 – 03 May 2026',
    days: '2 days',
    month: 'May 2026',
    status: 'Approved',
    icon: Plane,
  },
  {
    id: '6',
    type: 'Sick Leave',
    dates: '14 Apr 2026',
    days: '1 day',
    month: 'April 2026',
    status: 'Pending',
    icon: Activity,
  },
  {
    id: '7',
    type: 'Casual Leave',
    dates: '18 Jun 2026',
    days: '1 day',
    month: 'June 2026',
    status: 'Cancellation requested',
    icon: Sun,
  },
  {
    id: '8',
    type: 'Annual Leave',
    dates: '02 – 03 Jun 2026',
    days: '2 days',
    month: 'June 2026',
    status: 'Cancelled',
    icon: Plane,
  },
  {
    id: '9',
    type: 'Sick Leave',
    dates: '21 May 2026',
    days: '1 day',
    month: 'May 2026',
    status: 'Cancellation rejected',
    icon: Activity,
  },
];

// ---- Live-feed adapter -----------------------------------------------------

import type { MyLeaveRequest } from '../../api/leave';

/** Backend status → the card's status vocabulary. */
const STATUS_MAP: Record<string, RequestStatus> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  CANCELLATION_REQUESTED: 'Cancellation requested',
  CANCELLATION_REJECTED: 'Cancellation rejected',
};

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Icon by category — leave types are tenant-defined, so keep this coarse. */
function iconFor(request: MyLeaveRequest): LucideIcon {
  const category = String(request.category ?? '').toUpperCase();
  if (category === 'WFH' || category === 'OD') return Plane;
  if (category === 'REGULARIZATION') return CalendarDays;
  const code = String(request.leaveType?.code ?? '').toUpperCase();
  if (code.includes('SICK')) return Activity;
  if (code.includes('MAT') || code.includes('PAT')) return Baby;
  return Sun;
}

/** "12 – 14 Aug 2026", or a single date when the range is one day. */
function dateRange(startIso?: string, endIso?: string): string {
  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;
  if (!start || Number.isNaN(start.getTime())) return '—';
  const startLabel = `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}`;
  if (!end || Number.isNaN(end.getTime()) || start.getTime() === end.getTime()) {
    return `${startLabel} ${start.getFullYear()}`;
  }
  return `${startLabel} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
}

/** "31 Jul 2026", or undefined when there is no usable date. */
function shortDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Maps one server request onto the feed card's model. */
export function toRequest(row: MyLeaveRequest): Request {
  const start = row.startDate ? new Date(row.startDate) : null;
  const days = Number(row.dayCount ?? 0);
  const status =
    STATUS_MAP[String(row.status ?? '').toUpperCase()] ?? 'Pending';

  const category = String(row.category ?? '').toUpperCase();

  return {
    id: row.id,
    category,
    // The server already resolves this (leave type name, else the humanized
    // category), so take it as given. The fallbacks below only cover an older
    // payload that predates the field — the previous code had no
    // REGULARIZATION branch at all and defaulted everything to "Leave".
    type:
      row.type?.trim() ||
      row.leaveType?.name ||
      (category === 'WFH'
        ? 'Work From Home'
        : category === 'OD'
          ? 'On Duty'
          : category === 'REGULARIZATION'
            ? 'Regularization'
            : 'Leave'),
    dates: dateRange(row.startDate, row.endDate),
    days: `${days % 1 === 0 ? days : days.toFixed(1)} day${days === 1 ? '' : 's'}`,
    month:
      start && !Number.isNaN(start.getTime())
        ? `${MONTHS_LONG[start.getMonth()]} ${start.getFullYear()}`
        : 'Earlier',
    status,
    icon: iconFor(row),
    // displayReason has the attachment metadata stripped; the raw reason is
    // the fallback, as on the web.
    reason: (row.displayReason ?? row.reason ?? '').trim() || undefined,
    appliedOn: shortDate(row.createdAt),
    actionDate: shortDate(row.actionedAt),
    rejectionReason: row.decisionNote ?? undefined,
    // Index matters: the download endpoint addresses attachments by position,
    // so the array order has to survive as-is.
    attachments: row.attachments?.length ? row.attachments : undefined,
  };
}
