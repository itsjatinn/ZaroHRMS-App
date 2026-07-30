// Celebrations across the user's reporting tree — birthdays, work and wedding
// anniversaries and new joiners. Mirrors the web panel's Celebrations page
// exactly (types, palette, copy). Mock data until
// /api/employees/me/celebrations lands.

export type CelebrationKind =
  | 'birthday'
  | 'anniversary'
  | 'marriageAnniversary'
  | 'newJoiner';

export type Celebration = {
  id: string;
  employeeId: string;
  name: string;
  companyName?: string | null;
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

/** The upcoming list only looks this many days ahead — same as the web page. */
export const UPCOMING_DAYS = 7;

// Web dashboard palette (globals.css --brand-*) so the page matches exactly.
export const BRAND_PRIMARY = '#0D3749';
export const BRAND_SECONDARY = '#F9D36B';
export const brandAlpha = (opacity: number) => `rgba(13, 55, 73, ${opacity})`;

// Per-kind label, palette and the verb on the card's action button — the same
// values as the web panel's KIND_META so the two products read as one system.
export const KIND_META: Record<
  CelebrationKind,
  { label: string; color: string; bg: string; action: string }
> = {
  birthday: {
    label: 'Birthday',
    color: '#7C5CC6',
    bg: 'rgba(124, 92, 198, 0.14)',
    action: 'Wish',
  },
  anniversary: {
    label: 'Work anniversary',
    color: '#3F7B58',
    bg: 'rgba(94, 155, 123, 0.18)',
    action: 'Cheers',
  },
  marriageAnniversary: {
    label: 'Wedding anniversary',
    color: '#C2497A',
    bg: 'rgba(194, 73, 122, 0.14)',
    action: 'Wish',
  },
  newJoiner: {
    label: 'New joiner',
    color: '#5B5AB8',
    bg: 'rgba(91, 90, 184, 0.16)',
    action: 'Say hi',
  },
};

export const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All celebrations' },
  { value: 'birthday', label: 'Birthdays' },
  { value: 'anniversary', label: 'Anniversaries' },
  { value: 'marriageAnniversary', label: 'Wedding anniversaries' },
  { value: 'newJoiner', label: 'New joiners' },
];

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

// Same rotation the web panel hashes employees into when the API sends no
// explicit avatar colour.
const AVATAR_COLORS = [
  '#84cc16',
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#f97316',
  '#14b8a6',
  '#ec4899',
];

export function avatarColorForEmployee(
  employeeId: string,
  fallback?: string,
): string {
  if (fallback) return fallback;
  let hash = 0;
  for (const char of employeeId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const CELEBRATIONS: Celebration[] = [
  { id: 'c1', employeeId: 'emp-anjali', name: 'Anjali Sharma', designation: 'Senior Engineer', team: 'Platform', date: offsetDays(0), kind: 'birthday' },
  { id: 'c2', employeeId: 'emp-vikram', name: 'Vikram K.', companyName: 'Zaro', designation: 'Engineer II', team: 'Platform', date: offsetDays(0), kind: 'anniversary', years: 3 },
  { id: 'c3', employeeId: 'emp-rohit', name: 'Rohit M.', designation: 'Engineer I', team: 'Platform', date: offsetDays(0), kind: 'newJoiner', daysSinceJoin: 1 },
  { id: 'c4', employeeId: 'emp-priya', name: 'Priya N.', designation: 'Product Designer', team: 'Design', date: offsetDays(2), kind: 'birthday' },
  { id: 'c5', employeeId: 'emp-karan', name: 'Karan V.', designation: 'QA Engineer', team: 'QA', date: offsetDays(3), kind: 'newJoiner', daysSinceJoin: 3 },
  { id: 'c13', employeeId: 'emp-neha', name: 'Neha D.', designation: 'Operations Manager', team: 'Ops', date: offsetDays(4), kind: 'marriageAnniversary', years: 2 },
  { id: 'c6', employeeId: 'emp-sanjay', name: 'Sanjay K.', companyName: 'Zaro', designation: 'Engineer II', team: 'Platform', date: offsetDays(5), kind: 'anniversary', years: 1 },
  { id: 'c7', employeeId: 'emp-meera', name: 'Meera Rao', designation: 'Engineering Manager', team: 'Platform', date: offsetDays(6), kind: 'birthday' },
  { id: 'c8', employeeId: 'emp-ali', name: 'Ali Khan', companyName: 'Zaro', designation: 'Account Executive', team: 'Sales', date: offsetDays(7), kind: 'anniversary', years: 2 },
  { id: 'c9', employeeId: 'emp-zara', name: 'Zara Khan', designation: 'Marketing Lead', team: 'Marketing', date: offsetDays(18), kind: 'birthday' },
  { id: 'c10', employeeId: 'emp-arjun', name: 'Arjun T.', designation: 'Customer Success', team: 'CS', date: offsetDays(25), kind: 'newJoiner' },
  { id: 'c11', employeeId: 'emp-nisha', name: 'Nisha P.', companyName: 'Zaro', designation: 'Finance Analyst', team: 'Finance', date: offsetDays(40), kind: 'anniversary', years: 5 },
  { id: 'c12', employeeId: 'emp-divya', name: 'Divya G.', designation: 'HR Business Partner', team: 'People', date: offsetDays(55), kind: 'birthday' },
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

/** The weekday shown after the day label, e.g. "· Monday". */
export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long' });
}

/** The pill line on the card, e.g. "3 years at Zaro". */
export function metaLineFor(c: Celebration): string {
  switch (c.kind) {
    case 'birthday':
      return 'Birthday';
    case 'anniversary':
      return c.years
        ? `${c.years} ${c.years === 1 ? 'year' : 'years'} at ${
            c.companyName?.trim() || 'this company'
          }`
        : 'Work anniversary';
    case 'marriageAnniversary':
      return c.years
        ? `${c.years} ${c.years === 1 ? 'year' : 'years'} married`
        : 'Wedding anniversary';
    case 'newJoiner':
      return c.daysSinceJoin && c.daysSinceJoin >= 1
        ? `Joined ${c.daysSinceJoin} days ago`
        : 'Joined today';
  }
}

/**
 * Wishes open on the day itself; work anniversaries and new joiners stay
 * open through the following 7 days — same rule as the web panel.
 */
export function isWishOpen(c: Celebration): boolean {
  const date = new Date(c.date);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(
    start.getDate() +
      (c.kind === 'anniversary' || c.kind === 'newJoiner' ? 7 : 0),
  );
  return TODAY_MID >= start && TODAY_MID <= end;
}

/** Stable day key used to group a sorted list into date sections. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
