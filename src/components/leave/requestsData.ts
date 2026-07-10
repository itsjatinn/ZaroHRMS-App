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
  status: RequestStatus;
  icon: LucideIcon;
  iconColor: string;
  badgeClass: string; // pastel icon badge bg, e.g. "bg-blue-100"
};

// Shared leave-request feed used by the Leave overview and the "All requests"
// screen. Ordered newest-first.
export const REQUESTS: Request[] = [
  {
    id: '1',
    type: 'Annual Leave',
    dates: '12 – 14 Aug 2026',
    days: '3 days',
    status: 'Approved',
    icon: CalendarDays,
    iconColor: '#2563EB',
    badgeClass: 'bg-blue-100',
  },
  {
    id: '2',
    type: 'Sick Leave',
    dates: '28 Jul 2026',
    days: '1 day',
    status: 'Pending',
    icon: Activity,
    iconColor: '#059669',
    badgeClass: 'bg-emerald-100',
  },
  {
    id: '3',
    type: 'Paternity Leave',
    dates: '01 – 10 Sep 2026',
    days: '10 days',
    status: 'Approved',
    icon: Baby,
    iconColor: '#D9A53B',
    badgeClass: 'bg-amber-100',
  },
  {
    id: '4',
    type: 'Casual Leave',
    dates: '19 Jun 2026',
    days: '1 day',
    status: 'Rejected',
    icon: Sun,
    iconColor: '#E11D48',
    badgeClass: 'bg-rose-100',
  },
  {
    id: '5',
    type: 'Annual Leave',
    dates: '02 – 03 May 2026',
    days: '2 days',
    status: 'Approved',
    icon: Plane,
    iconColor: '#2563EB',
    badgeClass: 'bg-blue-100',
  },
  {
    id: '6',
    type: 'Sick Leave',
    dates: '14 Apr 2026',
    days: '1 day',
    status: 'Pending',
    icon: Activity,
    iconColor: '#059669',
    badgeClass: 'bg-emerald-100',
  },
];
