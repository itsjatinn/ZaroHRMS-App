import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  useAttendanceCalendar,
  useMyMonthDays,
  type CalendarDayKind,
} from '../api/attendance';
import { useHolidayCalendar, useOptionalHolidayContext } from '../api/holidays';
import { useRegularizationEnabled } from '../api/leave';
import { useModuleGate } from '../api/modules';
import { useAuth } from '../auth/AuthContext';
import { buildMonthWeeks, shiftMonthCursor } from './calendar/MonthCalendar';
import { cardShadow } from './shadow';

const NAVY = '#14323F';

/**
 * Dashed ring, drawn as an SVG stroke.
 *
 * React Native silently ignores `borderStyle: 'dashed'` once a view has a
 * border radius — it renders solid on device, even though react-native-web
 * honours it. Every "pending / applied" cue here is a dashed ring whose whole
 * job is to distinguish it from the solid-ringed "approved" state, so on a
 * phone those pairs were indistinguishable. Stroking a real circle is the only
 * way to get a dash that survives on both platforms.
 *
 * The dash pattern is derived from the circumference rather than hard-coded so
 * the ring closes evenly instead of leaving a ragged gap where the stroke
 * wraps, at both the 10px legend dot and the 36px day cell.
 */
function DashedRing({
  size,
  color,
  width = 1.5,
}: {
  size: number;
  color: string;
  width?: number;
}) {
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  // ~5px per dash+gap pair, then snapped to a whole number of pairs.
  const pairs = Math.max(4, Math.round(circumference / 5));
  const dash = circumference / (pairs * 2);
  return (
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={`${dash} ${dash}`}
        fill="none"
      />
    </Svg>
  );
}
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Status =
  | 'present'
  | 'in-progress'
  | 'absent'
  | 'half'
  | 'compoff-earned'
  | 'holiday'
  | 'applied'
  | 'approved'
  | 'work-applied'
  | 'wfh'
  | 'compoff'
  | 'lop'
  | 'optional-claimed'
  | 'optional-pending'
  | 'regularization-applied'
  | 'regularization-approved'
  | 'today';

/**
 * Day-pill treatment per status. Hues follow the web widget's legend dots;
 * outlined kinds (holiday, WFH/OD) carry a border because the web uses an
 * outline as their distinguishing cue.
 */
const STATUS_STYLE: Record<
  Status,
  {
    bg: string;
    text: string;
    border?: string;
    dashed?: boolean;
    /** Literal half-fill: solid left half, faint right — the web's shape cue. */
    halfFill?: [string, string];
  }
> = {
  present: { bg: 'rgba(94, 155, 123, 0.32)', text: '#2F6C4D' },
  /**
   * Punched in, not yet out. Deliberately NOT the Present green: the day's
   * outcome is only decided at punch-out, when worked hours can resolve it to
   * Half Day or even Absent. A dashed outline reads as "not settled yet".
   */
  'in-progress': {
    bg: 'rgba(148, 163, 184, 0.18)',
    text: '#475569',
    border: '#94A3B8',
    dashed: true,
  },
  /**
   * Pink, not the orange/green families: the web found absent and holiday both
   * sit in orange and were indistinguishable at cell size, and green collides
   * with Present. The half-fill also gives colour-blind users a shape cue.
   */
  half: {
    bg: 'transparent',
    text: '#9D174D',
    halfFill: ['rgba(236, 72, 153, 0.45)', 'rgba(236, 72, 153, 0.14)'],
  },
  absent: { bg: 'rgba(220, 38, 38, 0.26)', text: '#B91C1C' },
  /**
   * Worked on a configured week off / holiday. Split fill — teal (the credit)
   * over green (the day was worked) — so it can't be mistaken for Present's
   * solid green or Comp Off's ringed teal. Matches the web widget.
   */
  'compoff-earned': {
    bg: 'transparent',
    text: '#0F766E',
    halfFill: ['rgba(13, 148, 136, 0.38)', 'rgba(94, 155, 123, 0.30)'],
  },
  holiday: { bg: 'rgba(224, 120, 86, 0.32)', text: '#B04A2A' },
  applied: { bg: 'rgba(124, 123, 216, 0.3)', text: '#5B5AB8' },
  approved: { bg: 'rgba(212, 162, 74, 0.34)', text: '#A37526' },
  'work-applied': {
    bg: 'rgba(14, 165, 233, 0.18)',
    text: '#0369A1',
    border: 'rgba(14, 165, 233, 0.7)',
  },
  wfh: {
    bg: 'rgba(29, 78, 216, 0.2)',
    text: '#1D4ED8',
    border: '#1D4ED8',
    dashed: true,
  },
  compoff: {
    bg: 'rgba(13, 148, 136, 0.2)',
    text: '#0F766E',
    // Solid ring, as on web: the 20%-opacity teal fill alone is faint enough
    // to read as an unmarked day.
    border: '#0F766E',
  },
  lop: { bg: 'rgba(71, 84, 103, 0.26)', text: '#475467' },
  /**
   * Attendance regularization. Violet is the last hue with real separation
   * left here — every other family is spoken for — so the ring carries the
   * meaning as well as the colour: dashed while the request is pending, solid
   * once it has been approved and the day's times were corrected. That mirrors
   * how WFH/OD and optional holidays already distinguish applied from granted.
   */
  'regularization-applied': {
    bg: 'rgba(147, 51, 234, 0.16)',
    text: '#6B21A8',
    border: '#9333EA',
    dashed: true,
  },
  'regularization-approved': {
    bg: 'rgba(147, 51, 234, 0.28)',
    text: '#6B21A8',
    border: '#9333EA',
  },
  // Optional-holiday claims have no web equivalent yet; they reuse the holiday
  // hue (a claimed day is a day off) with the pending one dashed.
  // Ring is the deeper #C0552F, not the fill colour: against the same orange
  // fill an #E07856 ring is invisible, which is what made a claimed day
  // indistinguishable from an ordinary holiday. Matches the web cell.
  'optional-claimed': { bg: 'rgba(224, 120, 86, 0.32)', text: '#B04A2A', border: '#C0552F' },
  'optional-pending': {
    bg: 'rgba(212, 162, 74, 0.22)',
    text: '#A37526',
    border: 'rgba(212, 162, 74, 0.8)',
    dashed: true,
  },
  today: { bg: '#14323F', text: '#FFFFFF' },
};

/**
 * What each colour means, in the legend's own words. Tapping a day shows this,
 * so the grid can be read without opening the (collapsed) legend and matching
 * hues by eye — which is impossible for the pairs that differ only by ring.
 */
const STATUS_LABEL: Record<Status, string> = {
  present: 'Present',
  'in-progress': 'In progress',
  half: 'Half Day',
  absent: 'Absent',
  holiday: 'Holiday',
  applied: 'Leave applied',
  approved: 'Leave approved',
  'work-applied': 'WFH / On Duty applied',
  wfh: 'WFH / On Duty approved',
  compoff: 'Comp Off',
  'compoff-earned': 'Worked on off day (comp-off earned)',
  lop: 'Loss of Pay',
  'regularization-applied': 'Regularization applied',
  'regularization-approved': 'Regularization approved',
  'optional-claimed': 'Optional holiday claimed',
  'optional-pending': 'Optional holiday pending',
  today: 'Today',
};

/**
 * Dot colour for the label pill. The cell fills are translucent by design, so
 * the saturated `text` hue is what actually reads at dot size against white;
 * half-day carries no fill at all and borrows its left half.
 */
function labelDotColor(status: Status): string {
  const style = STATUS_STYLE[status];
  if (style.halfFill) return style.halfFill[0];
  return style.border ?? style.text;
}

// Demo statuses for June 2026 (month index 5) — one of each kind, so the
// offline build shows the full vocabulary.
const DEMO_STATUSES: Record<number, Status> = {
  1: 'absent',
  2: 'absent',
  3: 'holiday',
  5: 'absent',
  6: 'present',
  9: 'half',
  12: 'approved',
  16: 'wfh',
  17: 'work-applied',
  19: 'today',
  21: 'applied',
  24: 'compoff',
  26: 'lop',
  10: 'optional-claimed',
  11: 'optional-pending',
};

type LegendItem = {
  label: string;
  color: string;
  border?: string;
  dashed?: boolean;
  /** Half-filled dot, mirroring the cell pill (see the half-day note above). */
  halfFill?: [string, string];
};

// The web widget's legend groups, colour for colour. Attendance statuses and
// leave statuses are separate groups because each is licensed separately.
// No "In progress" key: an open punch now only ever shows on the current day
// (the nightly sweep resolves older ones to Absent), so the dashed pill is
// always the day the employee is looking at and needs no legend entry.
const ATTENDANCE_LEGEND: LegendItem[] = [
  { label: 'Present', color: '#5E9B7B' },
  { label: 'Absent', color: '#DC2626' },
  {
    label: 'Half Day',
    color: 'transparent',
    halfFill: ['#EC4899', 'rgba(236, 72, 153, 0.28)'],
  },
  // Split teal/green, mirroring the cell: worked the day (green) and it sits
  // in comp-off territory (teal). Distinct from Present and from the ringed
  // "Comp Off" leave dot.
  {
    label: 'Comp off earned',
    color: 'transparent',
    halfFill: ['#0F9488', '#5E9B7B'],
  },
  // After the three core outcomes: regularization modifies a day rather than
  // being an outcome of its own. Order matches the web widget key for key.
  {
    label: 'Regularization applied',
    color: 'rgba(147, 51, 234, 0.16)',
    border: '#9333EA',
    dashed: true,
  },
  { label: 'Regularization approved', color: '#9333EA' },
];

const HOLIDAY_LEGEND: LegendItem = {
  label: 'Holiday',
  // Plain, ring-free — the ring is what marks "Optional holiday claimed"
  // beside it, and the day cells never draw a ring for a plain holiday.
  // Matches the web widget's legend after the same fix.
  color: '#E07856',
};

const LEAVE_LEGEND: LegendItem[] = [
  { label: 'Leave applied', color: '#7C7BD8' },
  { label: 'Leave approved', color: '#D4A24A' },
  // "On Duty", not "OD": the web spells it out, and the abbreviation is not
  // self-evident to an employee reading the key for the first time.
  // The applied dot is the translucent fill + ring the cell uses, so the
  // legend teaches the actual treatment rather than a solid swatch that
  // appears nowhere on the grid.
  {
    label: 'WFH / On Duty applied',
    color: 'rgba(14, 165, 233, 0.28)',
    border: 'rgba(14, 165, 233, 0.75)',
  },
  // Dashed ring mirrors the cell (STATUS_STYLE.wfh), same as the web dot.
  {
    label: 'WFH / On Duty approved',
    color: '#1D4ED8',
    border: 'rgba(29, 78, 216, 0.5)',
    dashed: true,
  },
  { label: 'Comp Off', color: '#0F9488', border: 'rgba(13, 148, 136, 0.35)' },
  { label: 'Loss of Pay', color: '#475467' },
];

// Optional-holiday claims are their own record (not leave rows), so they are
// their own legend group — shown whenever either module is on, like Holiday.
// The dot mirrors the cell (the holiday hue with a solid ring), not a brown of
// its own — it previously showed a colour that appeared nowhere on the grid.
const OPTIONAL_CLAIMED_LEGEND: LegendItem = {
  label: 'Optional holiday claimed',
  color: '#E07856',
  border: '#C0552F',
};
// Only meaningful when HR requires approval — with auto-approve on, a claim is
// approved the moment it is made, so a pending day can never appear.
const OPTIONAL_PENDING_LEGEND: LegendItem = {
  label: 'Optional holiday pending',
  color: '#D4A24A',
  dashed: true,
  border: 'rgba(212, 162, 74, 0.7)',
};

type AttendanceCalendarCardProps = {
  variant?: 'card' | 'plain';
  /** Reports the month's day statuses so a parent can summarise them. */
  onMonthStatuses?: (statuses: Record<number, string>) => void;
  /** Reports whether this month is still resolving its first live payload. */
  onMonthLoadingChange?: (loading: boolean) => void;
  /** When provided, the calendar is controlled by the parent. */
  year?: number;
  month?: number; // 0-11
  /**
   * Lets a controlled parent keep the card's own arrows. Without it a
   * controlled card can only show a static label, since writing local state
   * would be overridden by the parent's props on the next render. With it the
   * arrows work exactly as they do uncontrolled, and the parent is told which
   * month to move to.
   */
  onMonthChange?: (year: number, month: number) => void;
  /** Attendance-page mode: keep the day colours but drop the leave legend
   *  group, which that page doesn't need to teach. */
  hideLeaveLegend?: boolean;
};

/** Calendar kinds → the card's day statuses. Unknown kinds stay unmarked. */
/** The web tooltip's vocabulary, for the tap-to-inspect strip below. */
const STATUS_LABELS: Partial<Record<Status, string>> = {
  present: 'Present',
  'in-progress': 'Punched in — day in progress',
  absent: 'Absent',
  half: 'Half Day',
  holiday: 'Holiday',
  applied: 'Leave applied',
  approved: 'Leave approved',
  'work-applied': 'WFH / On Duty applied',
  wfh: 'WFH / On Duty',
  compoff: 'Comp Off',
  lop: 'Loss of Pay',
  'optional-claimed': 'Optional holiday claimed',
  'optional-pending': 'Optional holiday pending',
  'regularization-applied': 'Regularization applied',
  'regularization-approved': 'Regularization approved',
};

/** Leave-family kinds — a work request on the same day gets the web's
 *  dashed overlap ring instead of overwriting the leave fill. */
const LEAVE_FAMILY: Status[] = ['applied', 'approved', 'lop', 'compoff'];

function toDayStatus(kind: CalendarDayKind | undefined): Status | undefined {
  switch (kind) {
    case 'present':
      return 'present';
    case 'in-progress':
      return 'in-progress';
    case 'half':
      return 'half';
    case 'absent':
      return 'absent';
    case 'wfh':
    case 'onduty':
      return 'wfh';
    case 'work-applied':
      return 'work-applied';
    case 'leave':
      return 'applied';
    case 'approved':
      return 'approved';
    case 'compoff':
      return 'compoff';
    case 'lop':
      return 'lop';
    case 'regularization-applied':
      return 'regularization-applied';
    case 'regularization-approved':
      return 'regularization-approved';
    default:
      return undefined;
  }
}

export default function AttendanceCalendarCard({
  variant = 'card',
  year,
  month,
  hideLeaveLegend = false,
  onMonthStatuses,
  onMonthLoadingChange,
  onMonthChange,
}: AttendanceCalendarCardProps) {
  const router = useRouter();
  const { isBackendSession } = useAuth();
  // Which modules the tenant licenses — gates the legend groups so a
  // Leave-only org never sees Present/Absent keys (and vice versa), matching
  // the web widget. On the demo session everything reads as on.
  const gate = useModuleGate(isBackendSession);
  const now = new Date();
  // month is 0-indexed. Live sessions open on the real current month; the
  // offline demo keeps June 2026, the month its sample statuses describe.
  const [internal, setInternal] = useState(
    isBackendSession
      ? { year: now.getFullYear(), month: now.getMonth() }
      : { year: 2026, month: 5 },
  );
  /**
   * The initialiser above runs on the first render, while AuthContext is still
   * restoring the session from the keychain — so isBackendSession is false then
   * and the month latches to the demo's June 2026. Once the session resolves,
   * jump to the real current month, but only once and only if the employee
   * hasn't already navigated somewhere themselves.
   */
  const monthSyncedRef = useRef(false);
  useEffect(() => {
    if (!isBackendSession || monthSyncedRef.current) return;
    monthSyncedRef.current = true;
    const today = new Date();
    setInternal({ year: today.getFullYear(), month: today.getMonth() });
  }, [isBackendSession]);
  const controlled = year != null && month != null;
  const cursor = controlled ? { year: year!, month: month! } : internal;
  // Arrows show whenever the month can actually move: always when this card
  // owns the month, and when a controlled parent opted in by passing a handler.
  const canShiftMonth = !controlled || onMonthChange != null;

  // Legend starts collapsed — it is reference material, not something the
  // employee reads every visit, and it was the tallest part of the card.
  const [legendOpen, setLegendOpen] = useState(false);
  // The tapped day. An actionable absence opens the Regularize / Apply-leave
  // menu; any other marked day names its status instead. Tapping it again (or
  // an unmarked day) dismisses.
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // Measured width of the day grid, needed to pixel-position the popover.
  const [gridWidth, setGridWidth] = useState(0);

  const isDemoMonth =
    !isBackendSession && cursor.year === 2026 && cursor.month === 5;

  // The same rich month view the web widget renders: attendance entries
  // overlaid with the month's leave/WFH/OD requests, comp-off and LOP flagged
  // apart, pending vs approved distinguished.
  const monthQuery = useAttendanceCalendar(
    cursor.year,
    cursor.month + 1,
    isBackendSession,
  );
  // The per-day off-day context (worked on a configured week off / holiday,
  // comp-off credited) only rides on me/month — the calendar feed doesn't
  // carry it.
  const myMonthQuery = useMyMonthDays(
    cursor.year,
    cursor.month + 1,
    isBackendSession,
  );
  // Holidays come from the holiday calendar, which both modules share — shown
  // whenever either is on, as on the web.
  const holidaysQuery = useHolidayCalendar(
    cursor.year,
    isBackendSession && (gate.attendanceOn || gate.leaveOn),
  );
  // Claimed optional holidays live in their own table, so /attendance/calendar
  // never reports them — they have to be merged in from the claim context or
  // a day the employee claimed would show as an ordinary working day.
  const optionalClaimsQuery = useOptionalHolidayContext(
    isBackendSession && (gate.attendanceOn || gate.leaveOn),
  );
  // Auto-approve on = claims apply instantly, so there is no pending state to
  // teach. The demo session shows both, since it demonstrates the full flow.
  // Regularization has its own master switch on top of the module — HR can
  // license attendance but still turn regularization off.
  const regularizationEnabled = useRegularizationEnabled(
    isBackendSession && gate.attendanceOn,
  );
  // Which resolutions an absent day can offer. The demo session shows both so
  // the flow is explorable offline.
  const canRegularize = !isBackendSession || (gate.attendanceOn && regularizationEnabled);
  const canApplyLeave = !isBackendSession || gate.leaveOn;

  const optionalAutoApprove = isBackendSession
    ? Boolean(optionalClaimsQuery.data?.autoApprove)
    : false;
  const gateLoading = isBackendSession && gate.modules == null;
  const attendanceLoading =
    isBackendSession &&
    gate.attendanceOn &&
    monthQuery.data == null &&
    (monthQuery.isLoading || monthQuery.isFetching);
  const holidaysLoading =
    isBackendSession &&
    (gate.attendanceOn || gate.leaveOn) &&
    holidaysQuery.data == null &&
    (holidaysQuery.isLoading || holidaysQuery.isFetching);
  const optionalClaimsLoading =
    isBackendSession &&
    (gate.attendanceOn || gate.leaveOn) &&
    optionalClaimsQuery.data == null &&
    (optionalClaimsQuery.isLoading || optionalClaimsQuery.isFetching);
  const monthLoading =
    gateLoading || attendanceLoading || holidaysLoading || optionalClaimsLoading;

  const dayStatuses = useMemo(() => {
    const map: Record<number, Status> = {};

    for (const holiday of holidaysQuery.data?.holidays ?? []) {
      const iso = String(holiday.isoDate || holiday.date || '');
      const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) continue;
      // Optional holidays only become days off once claimed, handled below.
      const optional =
        holiday.isOptional ||
        String(holiday.holidayType || holiday.type || '').toLowerCase() ===
          'optional';
      if (optional) continue;
      if (
        Number(match[1]) === cursor.year &&
        Number(match[2]) === cursor.month + 1
      ) {
        map[Number(match[3])] = 'holiday';
      }
    }

    // Optional-holiday claims sit above the plain holiday mark: the day is off
    // because this employee claimed it, which is the informative fact.
    for (const row of optionalClaimsQuery.data?.holidays ?? []) {
      const match = String(row.date ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) continue;
      if (
        Number(match[1]) !== cursor.year ||
        Number(match[2]) !== cursor.month + 1
      ) {
        continue;
      }
      if (row.claimStatus === 'APPROVED') {
        map[Number(match[3])] = 'optional-claimed';
      } else if (row.claimStatus === 'PENDING') {
        map[Number(match[3])] = 'optional-pending';
      }
    }

    // Attendance/leave kinds override a holiday mark — an approved WFH beside
    // a holiday is the informative one, same as the web.
    for (const [dayKey, kind] of Object.entries(
      monthQuery.data?.statusByDay ?? {},
    )) {
      const status = toDayStatus(kind);
      if (status) map[Number(dayKey)] = status;
    }

    // Worked on a configured off day → the comp-off-earned pill, the same
    // override the web widget applies: an auto-ABSENT on a week off reads
    // as "didn't work", the opposite of what happened.
    for (const row of myMonthQuery.data ?? []) {
      if (row?.context) map[row.day] = 'compoff-earned';
    }

    // Today's cell gets its ring only when nothing else already marks it.
    const today = new Date();
    if (
      cursor.year === today.getFullYear() &&
      cursor.month === today.getMonth() &&
      !map[today.getDate()]
    ) {
      map[today.getDate()] = 'today';
    }
    return map;
  }, [
    monthQuery.data,
    myMonthQuery.data,
    holidaysQuery.data,
    optionalClaimsQuery.data,
    cursor.year,
    cursor.month,
  ]);

  // Night-shift days get the web widget's "+1" corner marker: the shift ran
  // past midnight, so the next morning's punch-out counts for this day.
  const overnightDays = useMemo(
    () =>
      new Set(
        (myMonthQuery.data ?? [])
          .filter((row) => row?.overnight)
          .map((row) => row.day),
      ),
    [myMonthQuery.data],
  );

  // Days where a leave fill and a WFH/OD request coexist — the web draws a
  // dashed ring around the leave pill rather than letting one overwrite the
  // other; same here.
  const workRequestDays = useMemo(() => {
    const days = new Set<number>();
    for (const [dayKey, types] of Object.entries(
      monthQuery.data?.workTypesByDay ?? {},
    )) {
      const day = Number(dayKey);
      const status = dayStatuses[day];
      if (
        Array.isArray(types) &&
        types.length > 0 &&
        status &&
        LEAVE_FAMILY.includes(status)
      ) {
        days.add(day);
      }
    }
    return days;
  }, [monthQuery.data, dayStatuses]);

  // Tap-to-inspect: the mobile stand-in for the web tooltip. Tapping a
  // statused day shows its full story (leave-type names, work requests,
  // off-day context, night shift) in a strip under the grid.
  const [infoDay, setInfoDay] = useState<number | null>(null);
  const infoText = useMemo(() => {
    if (infoDay == null) return null;
    const status = isBackendSession
      ? dayStatuses[infoDay]
      : isDemoMonth
        ? DEMO_STATUSES[infoDay]
        : undefined;
    const parts: string[] = [];
    const row = (myMonthQuery.data ?? []).find((r) => r?.day === infoDay);
    // Absent WITH a punch-in = forgot to punch out. The pill stays Absent
    // (the day is still uncredited) but the strip says which, so the employee
    // knows to regularize rather than dispute an absence they didn't take.
    if (row?.missedPunch) {
      parts.push('Absent — punch-out is missing. Regularize to correct this day.');
    } else if (row?.late) {
      // Still Present (and green) — this only says why.
      parts.push('Late punch-in');
    }
    if (row?.context) {
      const base = row.context === 'HOLIDAY' ? 'holiday' : 'week off';
      parts.push(
        row.compOff
          ? `Worked on a ${base} — comp off credited`
          : `Worked on a configured ${base}`,
      );
    }
    const leaveNames = monthQuery.data?.leaveTypesByDay?.[infoDay] ?? [];
    parts.push(...leaveNames);
    const workTypes = (monthQuery.data?.workTypesByDay?.[infoDay] ?? []).map(
      (type) => {
        const label = type === 'WFH' ? 'Work from home' : 'On Duty';
        return status === 'work-applied' ? `${label} (Applied)` : label;
      },
    );
    parts.push(...workTypes);
    if (parts.length === 0 && status && status !== 'today') {
      const label = STATUS_LABELS[status];
      if (label) parts.push(label);
    }
    if (overnightDays.has(infoDay)) {
      parts.push('Night shift — ended next morning');
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [
    infoDay,
    isBackendSession,
    isDemoMonth,
    dayStatuses,
    monthQuery.data,
    myMonthQuery.data,
    overnightDays,
  ]);

  // Hand the resolved month up so the page's summary counts the same days the
  // grid draws, rather than a second, possibly divergent source.
  const statusesKey = JSON.stringify(dayStatuses);
  useEffect(() => {
    onMonthStatuses?.(dayStatuses);
    // statusesKey (not the object) so a fresh object with equal content is a
    // no-op rather than an infinite update loop.
  }, [onMonthStatuses, statusesKey, dayStatuses]);

  useEffect(() => {
    onMonthLoadingChange?.(monthLoading);
  }, [onMonthLoadingChange, monthLoading]);

  // Legend groups follow the licensed modules, like the web: a disabled
  // module's keys would advertise states that can never appear on the grid.
  const legend = useMemo(() => {
    const items: LegendItem[] = [];
    if (gate.attendanceOn) items.push(...ATTENDANCE_LEGEND);
    if (gate.attendanceOn || gate.leaveOn) {
      items.push(HOLIDAY_LEGEND, OPTIONAL_CLAIMED_LEGEND);
      if (!optionalAutoApprove) items.push(OPTIONAL_PENDING_LEGEND);
    }
    if (gate.leaveOn && !hideLeaveLegend) items.push(...LEAVE_LEGEND);
    return items;
  }, [gate.attendanceOn, gate.leaveOn, hideLeaveLegend, optionalAutoApprove]);

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    'en-US',
    { month: 'short', year: 'numeric' },
  );

  // `firstDay` stays a local: the absent-day popover positions itself from it,
  // which the shared helper has no reason to know about.
  const weeks = buildMonthWeeks(cursor.year, cursor.month);

  // Any month change (arrows here, or the parent's filter when controlled)
  // invalidates the selection and the day-info strip.
  useEffect(() => {
    setSelectedDay(null);
    setInfoDay(null);
  }, [cursor.year, cursor.month]);

  const shiftMonth = (delta: number) => {
    const next = shiftMonthCursor(cursor, delta);
    // Controlled: the parent owns the month (its summary has to count the same
    // one), so hand the change up. Writing local state here would be silently
    // discarded when the unchanged props re-render the card.
    if (controlled) onMonthChange?.(next.year, next.month);
    else setInternal(next);
  };

  /**
   * Today's attendance is only provisional — the final status is written when
   * the shift ends — so the current date can't be regularized, only past days.
   */
  const isTodayCell = (day: number) => {
    const now = new Date();
    return (
      cursor.year === now.getFullYear() &&
      cursor.month === now.getMonth() &&
      day === now.getDate()
    );
  };

  /**
   * A day's status, from the live month or the offline demo set. Shared by the
   * grid and the tap handler so the pill can never name a different status
   * than the colour the employee actually tapped.
   */
  const statusForDay = (day: number): Status | undefined => {
    if (isBackendSession) return dayStatuses[day];
    return isDemoMonth ? DEMO_STATUSES[day] : undefined;
  };

  /**
   * An absent day is actionable when it isn't in the future — you can't
   * regularize or take leave for a day that hasn't happened — and at least one
   * resolution route is available. With neither, the menu would open empty, so
   * the day falls back to naming its status like any other marked day.
   */
  const isActionableAbsence = (day: number, status: Status | undefined) => {
    if (status !== 'absent') return false;
    if ((!canRegularize || isTodayCell(day)) && !canApplyLeave) return false;
    const cellDate = new Date(cursor.year, cursor.month, day);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return cellDate <= endOfToday;
  };

  // Tap a marked day to toggle its popover — the action menu for an actionable
  // absence, otherwise the status name — plus, for non-actionable days, the
  // richer day-info strip below the grid (the mobile stand-in for the web
  // tooltip). An unmarked day just dismisses whatever is open.
  const handleDayPress = (day: number, status: Status | undefined) => {
    if (!status) {
      setSelectedDay(null);
      setInfoDay(null);
      return;
    }
    if (isActionableAbsence(day, status) || status === 'today') {
      setInfoDay(null);
    } else {
      setInfoDay((current) => (current === day ? null : day));
    }
    setSelectedDay((current) => (current === day ? null : day));
  };

  /** Hands the chosen flow the day, prefilled — the web does the same. */
  const openAbsenceAction = (view: 'regularize' | 'apply') => {
    if (selectedDay == null) return;
    const mm = String(cursor.month + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const iso = `${cursor.year}-${mm}-${dd}`;
    setSelectedDay(null);
    router.push(
      view === 'regularize'
        ? `/regularize?date=${iso}`
        : `/apply-leave?date=${iso}`,
    );
  };

  const selectedStatus =
    selectedDay != null ? statusForDay(selectedDay) : undefined;
  // An actionable absence keeps its menu; every other marked day names itself.
  const showActions =
    selectedDay != null && isActionableAbsence(selectedDay, selectedStatus);
  const infoLabel =
    !showActions && selectedStatus ? STATUS_LABEL[selectedStatus] : null;

  // Popover geometry: anchored to the selected day's cell, clamped to the
  // grid, flipped above the day when it sits in the last row.
  const ROW_H = 48; // h-12 day rows
  const showRegularize =
    canRegularize && showActions && !isTodayCell(selectedDay!);
  const actionCount = (showRegularize ? 1 : 0) + (canApplyLeave ? 1 : 0);
  // The label pill is sized to its text — the names run from "Present" to
  // "Regularization approved" — then clamped so it can never exceed the grid.
  const PILL_W = showActions
    ? actionCount > 1
      ? 196
      : 118
    : Math.min(Math.round((infoLabel?.length ?? 0) * 6.4) + 46, gridWidth || 240);
  const PILL_H = 34;
  let pillStyle: { top: number; left: number } | null = null;
  if (selectedDay != null && (showActions || infoLabel) && gridWidth > 0) {
    const position = firstDay + selectedDay - 1;
    const row = Math.floor(position / 7);
    const col = position % 7;
    const cellW = gridWidth / 7;
    const lastRow = row === weeks.length - 1;
    pillStyle = {
      top: lastRow ? row * ROW_H - PILL_H + 4 : (row + 1) * ROW_H - 4,
      left: Math.min(
        Math.max(col * cellW + cellW / 2 - PILL_W / 2, 0),
        gridWidth - PILL_W,
      ),
    };
  }

  return (
    <View
      // Only the card variant carries the shared card chrome; the inline
      // variant is embedded in a page that already provides its own surface.
      style={variant === 'card' ? cardShadow : undefined}
      className={
        variant === 'card'
          ? 'rounded-[22px] border border-slate-100 bg-white px-5 py-5'
          : 'px-1 py-1'
      }
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">Attendance</Text>
        {!canShiftMonth ? (
          <Text className="text-base font-bold text-ink">{label}</Text>
        ) : (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => shiftMonth(-1)}
              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 active:scale-95"
            >
              <Feather name="chevron-left" size={18} color={NAVY} />
            </Pressable>
            <Text className="text-base font-bold text-ink">{label}</Text>
            <Pressable
              onPress={() => shiftMonth(1)}
              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 active:scale-95"
            >
              <Feather name="chevron-right" size={18} color={NAVY} />
            </Pressable>
          </View>
        )}
      </View>

      <View className="mt-5 flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text
            key={i}
            className="flex-1 text-center text-xs font-semibold text-slate-400"
          >
            {d}
          </Text>
        ))}
      </View>

      <View
        className="relative mt-2"
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
      >
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, di) => {
              const status = day == null ? undefined : statusForDay(day);
              const isWeekend = di === 0 || di === 6;
              const selected = day != null && day === selectedDay;
              const style = status ? STATUS_STYLE[status] : null;
              return (
                <Pressable
                  key={di}
                  disabled={day == null}
                  onPress={() => day != null && handleDayPress(day, status)}
                  className="h-12 flex-1 items-center justify-center"
                >
                  {day == null ? null : status && style ? (
                    <View
                      className="h-9 w-9 items-center justify-center overflow-hidden rounded-full"
                      style={{
                        backgroundColor: style.bg,
                        // Absent days are actionable; the selected one gets an
                        // ink ring while its popover is showing. Otherwise the
                        // status's own outline cue (holiday, WFH/OD) applies.
                        // A dashed ring is drawn by DashedRing below, because a
                        // dashed border renders solid once the view is round.
                        // The selected ring is always solid and wins outright.
                        borderWidth: selected
                          ? 2
                          : STATUS_STYLE[status].border &&
                              !STATUS_STYLE[status].dashed
                            ? 1.5
                            : 0,
                        borderColor: selected
                          ? NAVY
                          : STATUS_STYLE[status].border,
                      }}
                    >
                      {!selected &&
                      STATUS_STYLE[status].dashed &&
                      STATUS_STYLE[status].border ? (
                        <DashedRing
                          size={36}
                          color={STATUS_STYLE[status].border!}
                        />
                      ) : null}
                      {STATUS_STYLE[status].halfFill ? (
                        <View className="absolute inset-0 flex-row overflow-hidden rounded-full">
                          <View
                            className="h-full flex-1"
                            style={{ backgroundColor: STATUS_STYLE[status].halfFill![0] }}
                          />
                          <View
                            className="h-full flex-1"
                            style={{ backgroundColor: STATUS_STYLE[status].halfFill![1] }}
                          />
                        </View>
                      ) : null}
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: STATUS_STYLE[status].text }}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      className={`text-sm ${
                        isWeekend ? 'text-slate-300' : 'text-ink'
                      }`}
                    >
                      {day}
                    </Text>
                  )}
                  {/* Leave + WFH/OD on the same day: the web keeps the leave
                      fill and adds a dashed work-request ring around it. */}
                  {day != null && workRequestDays.has(day) ? (
                    <View
                      pointerEvents="none"
                      className="absolute inset-0 items-center justify-center"
                    >
                      <DashedRing size={42} color="#7C7BD8" />
                    </View>
                  ) : null}
                  {day != null && overnightDays.has(day) ? (
                    <Text
                      className="absolute right-0.5 top-0.5 text-[8px] font-bold text-slate-400"
                      accessibilityLabel="Night shift, ended next morning"
                    >
                      +1
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Anchored to the selected day: the status name, or — for an absence
            the employee can still resolve — Regularize and/or Apply leave,
            whichever the org licenses. */}
        {pillStyle ? (
          <View
            style={{
              position: 'absolute',
              width: PILL_W,
              height: PILL_H,
              zIndex: 10,
              elevation: 6,
              shadowColor: NAVY,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              ...pillStyle,
            }}
            // The label pill is white so the status dot keeps its own hue; the
            // action menu stays ink, which reads as a control rather than a
            // caption.
            className={`flex-row overflow-hidden rounded-xl ${
              showActions ? 'bg-ink' : 'border border-slate-200 bg-white'
            }`}
          >
            {infoLabel && selectedStatus ? (
              <View className="h-full flex-1 flex-row items-center justify-center gap-1.5 px-2">
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: labelDotColor(selectedStatus) }}
                />
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold text-ink"
                >
                  {infoLabel}
                </Text>
              </View>
            ) : null}

            {showRegularize ? (
              <Pressable
                onPress={() => openAbsenceAction('regularize')}
                accessibilityRole="button"
                className="h-full flex-1 flex-row items-center justify-center gap-1.5 active:opacity-80"
              >
                <Feather name="rotate-ccw" size={13} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Regularize</Text>
              </Pressable>
            ) : null}

            {showRegularize && canApplyLeave ? (
              <View className="my-2 w-px bg-white/25" />
            ) : null}

            {showActions && canApplyLeave ? (
              <Pressable
                onPress={() => openAbsenceAction('apply')}
                accessibilityRole="button"
                className="h-full flex-1 flex-row items-center justify-center gap-1.5 active:opacity-80"
              >
                <Feather name="calendar" size={13} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Apply leave</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {monthLoading ? (
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center rounded-2xl bg-white/75"
          >
            <View className="flex-row items-center gap-2 rounded-full bg-white px-3 py-2">
              <ActivityIndicator size="small" color={NAVY} />
              <Text className="text-xs font-semibold text-slate-500">
                Loading attendance
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Tap-to-inspect strip — the mobile stand-in for the web tooltip.
          Tapping the strip (or the day again) dismisses it. */}
      {infoDay != null && infoText ? (
        <Pressable
          onPress={() => setInfoDay(null)}
          className="mt-3 flex-row items-start gap-2 rounded-xl bg-slate-50 px-3 py-2"
        >
          <Text className="text-xs font-bold text-ink">
            {infoDay} {label}
          </Text>
          <Text className="flex-1 text-xs text-slate-600">{infoText}</Text>
        </Pressable>
      ) : null}

      {isBackendSession && monthQuery.isError ? (
        <Text className="mt-3 text-center text-xs text-rose-500">
          Could not load this month. Pull to refresh or try another month.
        </Text>
      ) : null}

      {legend.length > 0 ? (
        <View className="mt-5 border-t border-slate-100 pt-3">
          <Pressable
            onPress={() => setLegendOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: legendOpen }}
            accessibilityLabel={legendOpen ? 'Hide legend' : 'Show legend'}
            className="flex-row items-center gap-1.5 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-slate-500">Legend</Text>
            <Text className="text-[11px] text-slate-400">
              · {legend.length} keys
            </Text>
            <View className="flex-1" />
            <Feather
              name={legendOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#94A3B8"
            />
          </Pressable>

          {legendOpen ? (
            <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
              {legend.map((item) => (
                <View key={item.label} className="flex-row items-center gap-1.5">
                  {item.halfFill ? (
                    <View className="h-2.5 w-2.5 flex-row overflow-hidden rounded-full">
                      <View
                        className="h-full flex-1"
                        style={{ backgroundColor: item.halfFill[0] }}
                      />
                      <View
                        className="h-full flex-1"
                        style={{ backgroundColor: item.halfFill[1] }}
                      />
                    </View>
                  ) : (
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: item.color,
                        // A dashed ring is drawn by DashedRing instead: a
                        // dashed *border* renders solid on device.
                        borderWidth: item.border && !item.dashed ? 1.5 : 0,
                        borderColor: item.border,
                      }}
                    >
                      {item.dashed && item.border ? (
                        <DashedRing size={10} color={item.border} />
                      ) : null}
                    </View>
                  )}
                  <Text className="text-xs text-slate-500">{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
