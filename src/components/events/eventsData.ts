// Calendar events — meetings, reviews, training, holidays and org events.
// Mirrors the web panel's employee Events section. Mock data until
// /api/calendar/events lands.

export type EventKind =
  | 'meeting'
  | 'review'
  | 'holiday'
  | 'celebration'
  | 'training'
  | 'event';

export type CalendarEvent = {
  id: string;
  title: string;
  /** ISO datetime — local. */
  start: string;
  /** Optional end datetime. Omitted for all-day events. */
  end?: string;
  /** All-day events skip the time line and sit in their own strip. */
  allDay?: boolean;
  kind: EventKind;
  meta?: string;
  venue?: string;
  meetingUrl?: string;
  organizer?: string;
  attendees?: number;
};

export type KindFilter = 'all' | EventKind;
export type CalendarView = 'grid' | 'month' | 'week' | 'list';

export const KIND_META: Record<
  EventKind,
  { label: string; color: string; bg: string }
> = {
  meeting: { label: 'Meeting', color: '#5B5AB8', bg: 'rgba(91, 90, 184, 0.16)' },
  review: { label: 'Review', color: '#A37526', bg: 'rgba(212, 162, 74, 0.22)' },
  holiday: { label: 'Holiday', color: '#B04A2A', bg: 'rgba(224, 120, 86, 0.18)' },
  celebration: { label: 'Celebration', color: '#7C5CC6', bg: 'rgba(124, 92, 198, 0.18)' },
  training: { label: 'Training', color: '#3F7B58', bg: 'rgba(94, 155, 123, 0.18)' },
  event: { label: 'Event', color: '#0D3749', bg: 'rgba(13, 55, 73, 0.12)' },
};

export const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'review', label: 'Reviews' },
  { value: 'holiday', label: 'Holidays' },
  { value: 'celebration', label: 'Celebrations' },
  { value: 'training', label: 'Training' },
  { value: 'event', label: 'Org events' },
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Hours rendered by the week timeline — 8am through 7pm. */
export const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

/** ISO datetime `daysFromToday` away at the given local time. */
function relativeISO(daysFromToday: number, hours = 9, mins = 0): string {
  const d = new Date();
  d.setHours(hours, mins, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString();
}

export const EVENTS: CalendarEvent[] = [
  { id: 'ev-1', title: 'Eng standup', start: relativeISO(0, 9, 30), end: relativeISO(0, 10, 0), kind: 'meeting', venue: 'Atlas + Meet', meetingUrl: 'https://meet.google.com/abc', organizer: 'Meera Rao', attendees: 12 },
  { id: 'ev-2', title: 'Design crit', start: relativeISO(0, 14, 0), end: relativeISO(0, 15, 0), kind: 'review', venue: 'Design pod', organizer: 'Priya N.', attendees: 6 },
  { id: 'ev-3', title: 'Sprint review', start: relativeISO(1, 15, 0), end: relativeISO(1, 16, 30), kind: 'meeting', venue: 'Atlas + Zoom', meetingUrl: 'https://zoom.us/j/123', organizer: 'Meera Rao', attendees: 18 },
  { id: 'ev-4', title: '1:1 with Meera', start: relativeISO(2, 11, 0), end: relativeISO(2, 11, 30), kind: 'review', organizer: 'Meera Rao', attendees: 2 },
  { id: 'ev-5', title: 'AI workshop', start: relativeISO(3, 14, 0), end: relativeISO(3, 17, 0), kind: 'training', venue: 'Atrium', organizer: 'Learning team', attendees: 35 },
  { id: 'ev-6', title: 'Buddha Purnima', start: relativeISO(3, 0, 0), allDay: true, kind: 'holiday', meta: 'Office closed' },
  { id: 'ev-7', title: "Anjali's birthday", start: relativeISO(4, 0, 0), allDay: true, kind: 'celebration', meta: 'Wish on #celebrations' },
  { id: 'ev-8', title: 'Town hall — Q2', start: relativeISO(6, 16, 0), end: relativeISO(6, 17, 30), kind: 'event', venue: 'Atrium + Zoom', meetingUrl: 'https://zoom.us/j/456', organizer: "CEO's office", attendees: 248 },
  { id: 'ev-9', title: 'Onboarding cohort kickoff', start: relativeISO(8, 10, 0), end: relativeISO(8, 12, 0), kind: 'training', venue: 'Atlas room 3', organizer: 'People Ops', attendees: 12 },
  { id: 'ev-10', title: 'Sprint planning', start: relativeISO(8, 11, 0), end: relativeISO(8, 12, 30), kind: 'meeting', venue: 'Atlas + Zoom', meetingUrl: 'https://zoom.us/j/789', organizer: 'Meera Rao', attendees: 12 },
  { id: 'ev-11', title: "Vikram's 3-year anniversary", start: relativeISO(10, 0, 0), allDay: true, kind: 'celebration', meta: 'Send kudos on #celebrations' },
  { id: 'ev-12', title: 'Mid-year review', start: relativeISO(12, 14, 0), end: relativeISO(12, 15, 0), kind: 'review', organizer: 'Meera Rao', attendees: 2 },
  { id: 'ev-13', title: 'Architecture deep-dive', start: relativeISO(14, 15, 0), end: relativeISO(14, 16, 30), kind: 'meeting', venue: 'Atlas room 5', organizer: 'Platform team', attendees: 14 },
  { id: 'ev-14', title: 'Wellness Wednesday — meditation', start: relativeISO(15, 17, 0), end: relativeISO(15, 17, 30), kind: 'event', venue: 'Mumbai breakout', organizer: 'Wellness committee', attendees: 25 },
  { id: 'ev-15', title: 'POSH training', start: relativeISO(18, 11, 0), end: relativeISO(18, 12, 0), kind: 'training', venue: 'LMS · self-paced', organizer: 'Compliance team' },
  { id: 'ev-16', title: 'Sprint review', start: relativeISO(22, 15, 0), end: relativeISO(22, 16, 30), kind: 'meeting', venue: 'Atlas + Zoom', meetingUrl: 'https://zoom.us/j/123', organizer: 'Meera Rao', attendees: 18 },
  { id: 'ev-17', title: 'Office offsite — Mysore', start: relativeISO(28, 0, 0), allDay: true, kind: 'event', meta: 'Two-day · transport arranged', venue: 'Mysore', organizer: 'People Ops', attendees: 80 },
  { id: 'ev-18', title: 'Office offsite — Mysore', start: relativeISO(29, 0, 0), allDay: true, kind: 'event', meta: 'Day 2', venue: 'Mysore', organizer: 'People Ops', attendees: 80 },
  { id: 'ev-19', title: 'Skip-level with Director', start: relativeISO(31, 16, 0), end: relativeISO(31, 16, 30), kind: 'review', organizer: 'Arjun T.', attendees: 2 },
];

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** "Monday, 12 Aug" — the header line on a day section or detail sheet. */
export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });
}

/** Day number of an ISO datetime — the big line in a date chip. */
export function dayNumber(iso: string): string {
  return String(new Date(iso).getDate());
}

/** "AUG" — the small line under the day number in a date chip. */
export function monthShort(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-IN', { month: 'short' })
    .toUpperCase();
}

/** "Wednesday" — the line under a title in the grid view. */
export function weekdayLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long' });
}

/** Start time, or "All day" — the one-line time summary used on rows. */
export function timeSummary(e: CalendarEvent): string {
  if (e.allDay) return 'All day';
  return `${formatTime(e.start)}${e.end ? ` – ${formatTime(e.end)}` : ''}`;
}

/** Stable day key used to group a sorted list into date sections. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Sorts ascending by start time without mutating the input. */
export function byStart(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}
