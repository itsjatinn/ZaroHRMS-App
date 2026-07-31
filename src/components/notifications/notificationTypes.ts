import {
  AlarmClock,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Clock,
  FileCheck2,
  FileText,
  Hourglass,
  Megaphone,
  Receipt,
  Repeat,
  Stethoscope,
  Timer,
  UserPlus,
  UserX,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * The notification type registry, ported from the web's
 * src/lib/notifications/types.ts. The app keys off the backend's `type`
 * string; unknown types fall back to a generic System descriptor rather than
 * throwing, so a newly added backend type still renders.
 */

export type NotificationTone = 'green' | 'cyan' | 'amber' | 'violet' | 'slate';

export type NotificationGroup =
  | 'Onboarding'
  | 'Offers'
  | 'Payroll'
  | 'Leave'
  | 'Attendance'
  | 'System';

export type NotificationDescriptor = {
  group: NotificationGroup;
  icon: LucideIcon;
  tone: NotificationTone;
};

/** Glyph chip colours per tone — the app's read of the web's hue tokens. */
export const TONE_STYLE: Record<
  NotificationTone,
  { bg: string; color: string }
> = {
  green: { bg: '#DCF0E3', color: '#3F8F5B' },
  cyan: { bg: '#D7EEFB', color: '#0E7DB3' },
  amber: { bg: '#FBEBD2', color: '#B8881F' },
  violet: { bg: '#E4E1F7', color: '#6B5FCF' },
  slate: { bg: '#E9EDF1', color: '#64748B' },
};

export const NOTIFICATION_DESCRIPTORS: Record<string, NotificationDescriptor> = {
  ONBOARDING_APPROVAL_PENDING: { group: 'Onboarding', icon: UserPlus, tone: 'green' },
  ONBOARDING_CANDIDATE_COMPLETED: { group: 'Onboarding', icon: FileCheck2, tone: 'green' },
  ONBOARDING_CANDIDATE_REJECTED: { group: 'Onboarding', icon: UserX, tone: 'amber' },
  PROBATION_CONFIRMATION_DUE: { group: 'Onboarding', icon: Hourglass, tone: 'amber' },
  PROBATION_CONFIRMED: { group: 'Onboarding', icon: CalendarCheck, tone: 'green' },
  PROBATION_EXTENDED: { group: 'Onboarding', icon: CalendarClock, tone: 'violet' },

  OFFER_SENT: { group: 'Offers', icon: FileText, tone: 'cyan' },
  OFFER_ACCEPTED: { group: 'Offers', icon: FileCheck2, tone: 'cyan' },
  OFFER_REJECTED: { group: 'Offers', icon: UserX, tone: 'amber' },

  PAYROLL_BATCH_GENERATED: { group: 'Payroll', icon: Receipt, tone: 'amber' },
  PAYSLIP_AVAILABLE: { group: 'Payroll', icon: Wallet, tone: 'amber' },

  APPROVALS_TRANSFERRED: { group: 'Leave', icon: ClipboardList, tone: 'cyan' },
  LEAVE_APPLIED: { group: 'Leave', icon: CalendarCheck, tone: 'violet' },
  LEAVE_APPROVED: { group: 'Leave', icon: CalendarCheck, tone: 'violet' },
  LEAVE_REJECTED: { group: 'Leave', icon: UserX, tone: 'amber' },
  LEAVE_CANCELLATION_REQUESTED: { group: 'Leave', icon: CalendarClock, tone: 'amber' },
  LEAVE_CANCELLATION_DECIDED: { group: 'Leave', icon: CalendarCheck, tone: 'violet' },
  OPTIONAL_HOLIDAY_CANCELLED: { group: 'Leave', icon: CalendarClock, tone: 'amber' },

  REGULARIZE_REQUESTED: { group: 'Attendance', icon: Clock, tone: 'violet' },
  REGULARIZE_APPROVED: { group: 'Attendance', icon: Stethoscope, tone: 'green' },
  REGULARIZE_REJECTED: { group: 'Attendance', icon: UserX, tone: 'amber' },
  ATTENDANCE_LATE_ARRIVAL: { group: 'Attendance', icon: AlarmClock, tone: 'amber' },
  ATTENDANCE_MISSED_PUNCH: { group: 'Attendance', icon: Timer, tone: 'amber' },
  ATTENDANCE_DAILY_SUMMARY: { group: 'Attendance', icon: CalendarDays, tone: 'cyan' },
  ATTENDANCE_REGULARIZE_REMINDER: { group: 'Attendance', icon: ClipboardList, tone: 'violet' },
  ATTENDANCE_REGULARIZE_ON_ABSENT: { group: 'Attendance', icon: CalendarClock, tone: 'amber' },
  OVERTIME_APPROVAL_PENDING: { group: 'Attendance', icon: Hourglass, tone: 'violet' },
  OVERTIME_APPROVED: { group: 'Attendance', icon: FileCheck2, tone: 'green' },
  OVERTIME_REJECTED: { group: 'Attendance', icon: UserX, tone: 'amber' },
  SHIFT_SWAP_UPDATE: { group: 'Attendance', icon: Repeat, tone: 'cyan' },
};

const FALLBACK: NotificationDescriptor = {
  group: 'System',
  icon: Megaphone,
  tone: 'slate',
};

export function describeNotification(type: string): NotificationDescriptor {
  return NOTIFICATION_DESCRIPTORS[type] ?? FALLBACK;
}

export type NotificationFilterId =
  | 'all'
  | 'unread'
  | NotificationGroup;

export const NOTIFICATION_FILTERS: {
  id: NotificationFilterId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'all', label: 'Inbox', icon: Bell },
  { id: 'unread', label: 'Unread', icon: Bell },
  { id: 'Onboarding', label: 'Onboarding', icon: UserPlus },
  { id: 'Offers', label: 'Offers', icon: FileText },
  { id: 'Payroll', label: 'Payroll', icon: Receipt },
  { id: 'Leave', label: 'Leave', icon: CalendarCheck },
  { id: 'Attendance', label: 'Attendance', icon: Timer },
  { id: 'System', label: 'System', icon: Megaphone },
];

/**
 * A filter is only offered when its module is licensed — listing a disabled
 * module's tab advertises a group that can never have rows. Inbox, Unread and
 * System are always available.
 */
export const FILTER_MODULE: Partial<Record<NotificationFilterId, string>> = {
  Onboarding: 'onboarding',
  Offers: 'offer-letter',
  Payroll: 'payroll-studio',
  Leave: 'leave',
  Attendance: 'attendance',
};

/** "Just now", "5 min ago", "3 hr ago", "Yesterday", "Mon", "8 Mar". */
export function formatRelativeTime(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString('en-IN', { weekday: 'short' });
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Day bucket used for the feed's section headers. */
export function dayBucket(input: string): 'Today' | 'Yesterday' | 'Earlier' {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date.getTime() >= start.getTime()) return 'Today';
  if (date.getTime() >= start.getTime() - 86400000) return 'Yesterday';
  return 'Earlier';
}
