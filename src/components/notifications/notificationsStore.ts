import {
  BellRing,
  Cake,
  CalendarCheck2,
  CalendarClock,
  FileText,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react-native';
import { useSyncExternalStore } from 'react';

export type NotificationDay = 'Today' | 'Yesterday' | 'Earlier';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string; // display-ready, e.g. "2h ago"
  day: NotificationDay;
  icon: LucideIcon;
  href?: string; // route to open on tap
  unread: boolean;
};

// ---- Demo feed (personal events only — company news lives in Announcements) ----
let notifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Leave request approved',
    body: 'Your sick leave for 28 Jul was approved by Riya Mehta.',
    time: '2h ago',
    day: 'Today',
    icon: CalendarCheck2,
    href: '/requests',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Missed check-in?',
    body: 'No check-in recorded today. Regularize it if you forgot.',
    time: '9:41 AM',
    day: 'Today',
    icon: BellRing,
    href: '/regularize',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Work anniversary',
    body: 'Arjun Nair completes 3 years at Zaro. Say congrats!',
    time: 'Yesterday',
    day: 'Yesterday',
    icon: PartyPopper,
    unread: true,
  },
  {
    id: 'n4',
    title: 'Regularization pending',
    body: 'Your "Missed punch" request is awaiting Reporting Manager approval.',
    time: 'Yesterday',
    day: 'Yesterday',
    icon: CalendarClock,
    href: '/requests',
    unread: false,
  },
  {
    id: 'n5',
    title: 'Upcoming birthday',
    body: "Priya Sharma's birthday is on 18 Jul.",
    time: '3d ago',
    day: 'Earlier',
    icon: Cake,
    unread: false,
  },
  {
    id: 'n6',
    title: 'Leave policy updated',
    body: 'The FY27 leave policy has been published. Review the changes.',
    time: '5d ago',
    day: 'Earlier',
    icon: FileText,
    href: '/documents',
    unread: false,
  },
];

// ---- Minimal external store so headers and the screen share live state ----
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getNotifications() {
  return notifications;
}

function getUnreadCount() {
  return notifications.filter((n) => n.unread).length;
}

export function markAllRead() {
  if (!notifications.some((n) => n.unread)) return;
  notifications = notifications.map((n) => ({ ...n, unread: false }));
  emit();
}

/** Live notification list (re-renders on store changes). */
export function useNotifications() {
  return useSyncExternalStore(subscribe, getNotifications);
}

/** Live unread count — drives the gold dot on header bells. */
export function useUnreadCount() {
  return useSyncExternalStore(subscribe, getUnreadCount);
}
