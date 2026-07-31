import type { ServerNotification } from '../../api/notifications';
import { useUnreadNotificationCount } from '../../api/notifications';
import { useAuth } from '../../auth/AuthContext';

/**
 * Notification sample data + the unread badge hook.
 *
 * The feed itself is server-owned (see src/api/notifications.ts). What lives
 * here is the offline demo set — written in the server's own row shape, so the
 * page and card render it through exactly the same code path as live data.
 */

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export const DEMO_NOTIFICATIONS: ServerNotification[] = [
  {
    id: 'n1',
    type: 'LEAVE_APPROVED',
    title: 'Leave request approved',
    body: 'Your sick leave for 28 Jul was approved by Riya Mehta.',
    link: '/dashboard/employee/leave',
    metadata: null,
    readAt: null,
    createdAt: ago(2 * HOUR),
  },
  {
    id: 'n2',
    type: 'ATTENDANCE_MISSED_PUNCH',
    title: 'Missed punch-out',
    body: 'You did not punch out yesterday. Regularize it to keep the day marked present.',
    link: '/modules/attendance/regularize',
    metadata: null,
    readAt: null,
    createdAt: ago(5 * HOUR),
  },
  {
    id: 'n3',
    type: 'PAYSLIP_AVAILABLE',
    title: 'Payslip available',
    body: 'Your payslip for June 2026 is ready to download.',
    link: '/dashboard/employee/payslips',
    metadata: null,
    readAt: null,
    createdAt: ago(26 * HOUR),
  },
  {
    id: 'n4',
    type: 'REGULARIZE_APPROVED',
    title: 'Regularization approved',
    body: 'Your missed punch for 24 Jul was regularized.',
    link: '/modules/attendance',
    metadata: null,
    readAt: ago(27 * HOUR),
    createdAt: ago(28 * HOUR),
  },
  {
    id: 'n5',
    type: 'OPTIONAL_HOLIDAY_CANCELLED',
    title: 'Optional holiday claim cancelled',
    body: 'Your claim for Raksha Bandhan was cancelled.',
    link: '/modules/attendance/holidaycalendar',
    metadata: null,
    readAt: ago(3 * DAY),
    createdAt: ago(3 * DAY),
  },
  {
    id: 'n6',
    type: 'SHIFT_SWAP_UPDATE',
    title: 'Shift swap confirmed',
    body: 'Your swap with Vikram K. for 02 Aug is confirmed.',
    link: '/modules/attendance',
    metadata: null,
    readAt: ago(4 * DAY),
    createdAt: ago(4 * DAY),
  },
];

/**
 * Unread count for the header bells. A live session reads the zone-aware
 * endpoint and re-polls, so a notification raised elsewhere lights the bell;
 * the demo session counts its own sample rows.
 */
export function useUnreadCount(): number {
  const { isBackendSession } = useAuth();
  const query = useUnreadNotificationCount(isBackendSession);
  if (!isBackendSession) {
    return DEMO_NOTIFICATIONS.filter((n) => !n.readAt).length;
  }
  return query.data ?? 0;
}
