import {
  CircleCheck,
  CircleX,
  Clock,
  FileClock,
  Plane,
  Receipt,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type Status = 'Pending' | 'Approved' | 'Rejected';

export const STATUS_META: Record<
  Status,
  { color: string; badge: string; icon: LucideIcon }
> = {
  Pending: { color: '#D9A53B', badge: 'bg-amber-100', icon: Clock },
  Approved: { color: '#059669', badge: 'bg-emerald-100', icon: CircleCheck },
  Rejected: { color: '#E11D48', badge: 'bg-rose-100', icon: CircleX },
};

export type Request = {
  type: string;
  title: string;
  sub: string;
  status: Status;
  icon: LucideIcon;
  color: string;
  badge: string;
};

export const REQUESTS: Request[] = [
  { type: 'Leave', title: 'Casual Leave', sub: '20 – 21 Jun 2026', status: 'Pending', icon: Plane, color: '#2563EB', badge: 'bg-blue-100' },
  { type: 'Regularization', title: 'Missed punch-out', sub: '14 Jun 2026', status: 'Approved', icon: FileClock, color: '#6B5FCF', badge: 'bg-violet-100' },
  { type: 'Reimbursement', title: 'Travel claim', sub: '₹2,400 · 10 Jun 2026', status: 'Approved', icon: Receipt, color: '#059669', badge: 'bg-emerald-100' },
  { type: 'Leave', title: 'Sick Leave', sub: '02 Jun 2026', status: 'Rejected', icon: Plane, color: '#2563EB', badge: 'bg-blue-100' },
];

export const REQUEST_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
export type RequestFilter = (typeof REQUEST_FILTERS)[number];
