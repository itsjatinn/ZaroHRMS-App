import {
  Activity,
  Baby,
  CalendarDays,
  Plane,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';

import type { RequestStatus } from './RequestCard';

export type Request = {
  id: string;
  type: string;
  dates: string;
  days: string;
  month: string; // section header on the "All requests" screen, e.g. "August 2026"
  status: RequestStatus;
  icon: LucideIcon;
  rejectionReason?: string; // shown collapsibly on rejected cards
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
