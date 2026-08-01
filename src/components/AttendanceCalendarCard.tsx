import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
  compoff: { bg: 'rgba(13, 148, 136, 0.2)', text: '#0F766E' },
  lop: { bg: 'rgba(71, 84, 103, 0.26)', text: '#475467' },
  // Optional-holiday claims have no web equivalent yet; they reuse the holiday
  // hue (a claimed day is a day off) with the pending one dashed.
  'optional-claimed': { bg: 'rgba(224, 120, 86, 0.32)', text: '#B04A2A', border: '#E07856' },
  'optional-pending': {
    bg: 'rgba(212, 162, 74, 0.22)',
    text: '#A37526',
    border: '#D4A24A',
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
const ATTENDANCE_LEGEND: LegendItem[] = [
  { label: 'Present', color: '#5E9B7B' },
  { label: 'In progress', color: '#94A3B8', dashed: true },
  { label: 'Absent', color: '#DC2626' },
  {
    label: 'Half Day',
    color: 'transparent',
    halfFill: ['#EC4899', 'rgba(236, 72, 153, 0.28)'],
  },
];

const HOLIDAY_LEGEND: LegendItem = {
  label: 'Holiday',
  color: '#E07856',
};

const LEAVE_LEGEND: LegendItem[] = [
  { label: 'Leave applied', color: '#7C7BD8' },
  { label: 'Leave approved', color: '#D4A24A' },
  { label: 'WFH / OD applied', color: '#0EA5E9' },
  { label: 'WFH / OD approved', color: '#1D4ED8' },
  { label: 'Comp Off', color: '#0F9488' },
  { label: 'Loss of Pay', color: '#475467' },
];

// Optional-holiday claims are their own record (not leave rows), so they are
// their own legend group — shown whenever either module is on, like Holiday.
const OPTIONAL_CLAIMED_LEGEND: LegendItem = {
  label: 'Optional holiday claimed',
  color: '#8B5E34',
};
// Only meaningful when HR requires approval — with auto-approve on, a claim is
// approved the moment it is made, so a pending day can never appear.
const OPTIONAL_PENDING_LEGEND: LegendItem = {
  label: 'Optional holiday pending',
  color: '#C89B6A',
  dashed: true,
  border: '#8B5E34',
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
   * An absent day is actionable when it isn't in the future — you can't
   * regularize or take leave for a day that hasn't happened — and at least one
   * resolution route is available. With neither, the menu would open empty, so
   * the day stays an inert pill rather than a control that does nothing.
   */
  const isActionableAbsence = (day: number, status: Status | undefined) => {
    if (status !== 'absent') return false;
    if (!canRegularize && !canApplyLeave) return false;
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
  const actionCount = (canRegularize ? 1 : 0) + (canApplyLeave ? 1 : 0);
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
                        borderWidth: selected
                          ? 2
                          : STATUS_STYLE[status].border
                            ? 1.5
                            : 0,
                        borderColor: selected
                          ? NAVY
                          : STATUS_STYLE[status].border,
                        borderStyle:
                          !selected && STATUS_STYLE[status].dashed
                            ? 'dashed'
                            : 'solid',
                      }}
                    >
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
            {canRegularize ? (
              <Pressable
                onPress={() => openAbsenceAction('regularize')}
                accessibilityRole="button"
                className="h-full flex-1 flex-row items-center justify-center gap-1.5 active:opacity-80"
              >
                <Feather name="rotate-ccw" size={13} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Regularize</Text>
              </Pressable>
            ) : null}

            {canRegularize && canApplyLeave ? (
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
                        borderWidth: item.border ? 1.5 : 0,
                        borderColor: item.border,
                        borderStyle: item.dashed ? 'dashed' : 'solid',
                      }}
                    />
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
