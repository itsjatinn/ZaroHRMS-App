import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  useAttendanceCalendar,
  type CalendarDayKind,
} from '../api/attendance';
import { useHolidayCalendar, useOptionalHolidayContext } from '../api/holidays';
import { useRegularizationEnabled } from '../api/leave';
import { useModuleGate } from '../api/modules';
import { useAuth } from '../auth/AuthContext';
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
  color: '#E07856',
  // Faint ring, as on the web dot — it is what separates Holiday from the
  // solid-ringed "Optional holiday claimed" sitting right beside it.
  border: 'rgba(224, 120, 86, 0.4)',
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
  /** When provided, the calendar is controlled by the parent (arrows hidden). */
  year?: number;
  month?: number; // 0-11
  /** Attendance-page mode: keep the day colours but drop the leave legend
   *  group, which that page doesn't need to teach. */
  hideLeaveLegend?: boolean;
};

/** Calendar kinds → the card's day statuses. Unknown kinds stay unmarked. */
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
  const setCursor = setInternal;

  // Legend starts collapsed — it is reference material, not something the
  // employee reads every visit, and it was the tallest part of the card.
  const [legendOpen, setLegendOpen] = useState(false);
  // Absent day awaiting action; tapping it again (or any other day) dismisses.
  const [selectedAbsent, setSelectedAbsent] = useState<number | null>(null);
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
    holidaysQuery.data,
    optionalClaimsQuery.data,
    cursor.year,
    cursor.month,
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
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    'en-US',
    { month: 'short', year: 'numeric' },
  );

  // Build cells: leading blanks + days, chunked into weeks of 7.
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Any month change (arrows here, or the parent's filter when controlled)
  // invalidates the selection.
  useEffect(() => {
    setSelectedAbsent(null);
  }, [cursor.year, cursor.month]);

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      return {
        year: c.year + Math.floor(m / 12),
        month: ((m % 12) + 12) % 12,
      };
    });
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
   * An absent day is actionable when it isn't in the future — you can't
   * regularize or take leave for a day that hasn't happened — and at least one
   * resolution route is available. With neither, the menu would open empty, so
   * the day stays an inert pill rather than a control that does nothing.
   */
  const isActionableAbsence = (day: number, status: Status | undefined) => {
    if (status !== 'absent') return false;
    if ((!canRegularize || isTodayCell(day)) && !canApplyLeave) return false;
    const cellDate = new Date(cursor.year, cursor.month, day);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return cellDate <= endOfToday;
  };

  // Tap an actionable absent day to toggle its menu; any other day dismisses.
  const handleDayPress = (day: number, status: Status | undefined) => {
    if (isActionableAbsence(day, status)) {
      setSelectedAbsent((current) => (current === day ? null : day));
    } else {
      setSelectedAbsent(null);
    }
  };

  /** Hands the chosen flow the day, prefilled — the web does the same. */
  const openAbsenceAction = (view: 'regularize' | 'apply') => {
    if (selectedAbsent == null) return;
    const mm = String(cursor.month + 1).padStart(2, '0');
    const dd = String(selectedAbsent).padStart(2, '0');
    const iso = `${cursor.year}-${mm}-${dd}`;
    setSelectedAbsent(null);
    router.push(
      view === 'regularize'
        ? `/regularize?date=${iso}`
        : `/apply-leave?date=${iso}`,
    );
  };

  // Popover geometry: anchored to the selected day's cell, clamped to the
  // grid, flipped above the day when it sits in the last row.
  const ROW_H = 48; // h-12 day rows
  const showRegularize =
    canRegularize && selectedAbsent != null && !isTodayCell(selectedAbsent);
  const actionCount = (showRegularize ? 1 : 0) + (canApplyLeave ? 1 : 0);
  const PILL_W = actionCount > 1 ? 196 : 118;
  const PILL_H = 34;
  let pillStyle: { top: number; left: number } | null = null;
  if (selectedAbsent != null && gridWidth > 0) {
    const position = firstDay + selectedAbsent - 1;
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
        {controlled ? (
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
              const status = day
                ? isBackendSession
                  ? dayStatuses[day]
                  : isDemoMonth
                    ? DEMO_STATUSES[day]
                    : undefined
                : undefined;
              const isWeekend = di === 0 || di === 6;
              const selected = day != null && day === selectedAbsent;
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
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Absent-day menu: Regularize and/or Apply leave, whichever the
            org licenses — anchored to the selected day. */}
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
            className="flex-row overflow-hidden rounded-xl bg-ink"
          >
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

            {canApplyLeave ? (
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
