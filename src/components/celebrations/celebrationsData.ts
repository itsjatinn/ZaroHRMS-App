// Celebrations across the user's reporting tree — birthdays, work anniversaries
// and new joiners. Mirrors the web panel's employee Celebrations section.
// Mock data until /api/employees/me/celebrations lands.

export type CelebrationKind = 'birthday' | 'anniversary' | 'newJoiner';

export type Celebration = {
  id: string;
  employeeId: string;
  name: string;
  designation?: string;
  team?: string;
  /** ISO date of the celebration this year. */
  date: string;
  kind: CelebrationKind;
  /** For anniversaries — years count. */
  years?: number;
  /** For new joiners — days since they joined. */
  daysSinceJoin?: number;
  avatarBg?: string;
};

export type KindFilter = 'all' | CelebrationKind;
export type RangeKey = 'today' | 'week' | 'month' | 'quarter';

// Per-kind label, palette, the verb on the card's action button, the label once
// a note has been sent, and the quick-pick messages offered in the composer.
// The tints match the web panel so the two products read as one system.
export const KIND_META: Record<
  CelebrationKind,
  {
    label: string;
    color: string;
    bg: string;
    action: string;
    sent: string;
    suggestions: string[];
  }
> = {
  birthday: {
    label: 'Birthday',
    color: '#7C5CC6',
    bg: 'rgba(124, 92, 198, 0.14)',
    action: 'Wish',
    sent: 'Wished',
    suggestions: [
      'Happy birthday! Hope you have a brilliant day 🎉',
      'Many happy returns — enjoy your day!',
      'Wishing you a fantastic year ahead 🎂',
    ],
  },
  anniversary: {
    label: 'Work anniversary',
    color: '#3F7B58',
    bg: 'rgba(94, 155, 123, 0.18)',
    action: 'Cheers',
    sent: 'Cheered',
    suggestions: [
      'Congratulations on the milestone — here is to many more!',
      'Happy work anniversary! Great having you on the team 🎊',
      'Thanks for everything you bring to the team. Congrats!',
    ],
  },
  newJoiner: {
    label: 'New joiner',
    color: '#5B5AB8',
    bg: 'rgba(91, 90, 184, 0.16)',
    action: 'Say hi',
    sent: 'Greeted',
    suggestions: [
      'Welcome aboard! Shout if you need anything 👋',
      'Great to have you with us — looking forward to working together.',
      'Welcome to Zaro! Happy to help you settle in.',
    ],
  },
};

export const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All celebrations' },
  { value: 'birthday', label: 'Birthdays' },
  { value: 'anniversary', label: 'Anniversaries' },
  { value: 'newJoiner', label: 'New joiners' },
];

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'Next 90 days' },
];

// How many days each range reaches forward from today.
export const RANGE_DAYS: Record<RangeKey, number> = {
  today: 0,
  week: 7,
  month: 30,
  quarter: 90,
};

const DAY_MS = 86400000;

const now = new Date();
export const TODAY_MID = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
);

/** ISO date `days` from today at midnight — keeps the mock list always current. */
function offsetDays(days: number): string {
  return new Date(TODAY_MID.getTime() + days * DAY_MS).toISOString();
}

/** True when `iso` falls between today and `days` ahead (inclusive). */
export function inNextNDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  return t >= TODAY_MID.getTime() && t <= TODAY_MID.getTime() + days * DAY_MS;
}

export const CELEBRATIONS: Celebration[] = [
  { id: 'c1', employeeId: 'emp-anjali', name: 'Anjali Sharma', designation: 'Senior Engineer', team: 'Platform', date: offsetDays(0), kind: 'birthday', avatarBg: '#7C5CC6' },
  { id: 'c2', employeeId: 'emp-vikram', name: 'Vikram K.', designation: 'Engineer II', team: 'Platform', date: offsetDays(0), kind: 'anniversary', years: 3, avatarBg: '#5E9B7B' },
  { id: 'c3', employeeId: 'emp-rohit', name: 'Rohit M.', designation: 'Engineer I', team: 'Platform', date: offsetDays(0), kind: 'newJoiner', daysSinceJoin: 1, avatarBg: '#3D7BB6' },
  { id: 'c4', employeeId: 'emp-priya', name: 'Priya N.', designation: 'Product Designer', team: 'Design', date: offsetDays(2), kind: 'birthday', avatarBg: '#D4A24A' },
  { id: 'c5', employeeId: 'emp-karan', name: 'Karan V.', designation: 'QA Engineer', team: 'QA', date: offsetDays(3), kind: 'newJoiner', daysSinceJoin: 3, avatarBg: '#B04A2A' },
  { id: 'c6', employeeId: 'emp-sanjay', name: 'Sanjay K.', designation: 'Engineer II', team: 'Platform', date: offsetDays(5), kind: 'anniversary', years: 1, avatarBg: '#7C5CC6' },
  { id: 'c7', employeeId: 'emp-meera', name: 'Meera Rao', designation: 'Engineering Manager', team: 'Platform', date: offsetDays(8), kind: 'birthday', avatarBg: '#0D3749' },
  { id: 'c8', employeeId: 'emp-ali', name: 'Ali Khan', designation: 'Account Executive', team: 'Sales', date: offsetDays(12), kind: 'anniversary', years: 2, avatarBg: '#5E9B7B' },
  { id: 'c9', employeeId: 'emp-zara', name: 'Zara Khan', designation: 'Marketing Lead', team: 'Marketing', date: offsetDays(18), kind: 'birthday', avatarBg: '#B04A2A' },
  { id: 'c10', employeeId: 'emp-arjun', name: 'Arjun T.', designation: 'Customer Success', team: 'CS', date: offsetDays(25), kind: 'newJoiner', avatarBg: '#5B5AB8' },
  { id: 'c11', employeeId: 'emp-nisha', name: 'Nisha P.', designation: 'Finance Analyst', team: 'Finance', date: offsetDays(40), kind: 'anniversary', years: 5, avatarBg: '#D4A24A' },
  { id: 'c12', employeeId: 'emp-divya', name: 'Divya G.', designation: 'HR Business Partner', team: 'People', date: offsetDays(55), kind: 'birthday', avatarBg: '#3F7B58' },
];

/** First + last initial, e.g. "Anjali Sharma" → "AS". */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Relative day label — "Today", "In 3 days", or a short date further out. */
export function formatDayLabel(iso: string): string {
  const t = new Date(iso);
  const tMid = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  const diff = Math.round((tMid - TODAY_MID.getTime()) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  if (diff < 7) return `In ${diff} days`;
  return t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });
}

/** The line under the name, e.g. "3 years at Zaro". */
export function metaLineFor(c: Celebration): string {
  switch (c.kind) {
    case 'birthday':
      return 'Birthday';
    case 'anniversary':
      return c.years
        ? `${c.years} ${c.years === 1 ? 'year' : 'years'} at Zaro`
        : 'Work anniversary';
    case 'newJoiner':
      return c.daysSinceJoin && c.daysSinceJoin >= 1
        ? `New joiner · Day ${c.daysSinceJoin}`
        : 'New joiner';
  }
}

/** Stable day key used to group a sorted list into date sections. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
