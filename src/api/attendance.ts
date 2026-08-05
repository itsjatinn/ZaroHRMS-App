import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';

/**
 * Attendance for the home page — today's punch state and the month grid.
 * Same endpoints the web panel's PunchWidget / AttendanceCalendarWidget use
 * (backend/src/attendance/attendance.controller.ts).
 */

/** The backend's AttendanceStatus enum. */
export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LEAVE'
  | 'WFH'
  | 'WO'
  | 'HOLIDAY'
  | 'HALF_DAY'
  | 'ON_DUTY'
  | (string & {});

/** The shift attached to today's entry — drives the punch-out projection. */
export type ShiftSummary = {
  name?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  /** Shift crosses midnight (punch-out lands on the next calendar day). */
  isNightShift?: boolean;
  /** Hours needed for a half day / full day. */
  halfDayHrs?: number | null;
  fullDayHrs?: number | null;
};

export type AttendanceDay = {
  id?: string;
  /** ISO date-time of the entry's business date. */
  date?: string;
  status?: AttendanceStatus | null;
  punchInAt?: string | null;
  punchOutAt?: string | null;
  totalHours?: number | null;
  overtimeHours?: number | null;
  lateMinutes?: number | null;
  earlyExitMinutes?: number | null;
  shift?: ShiftSummary | null;
  /** The entry's business date. For a night shift still open past midnight
   *  this is YESTERDAY's date. */
  businessDate?: string | null;
  /** True when the entry is yesterday's still-open night shift. */
  overnightOpen?: boolean;
} | null;

/**
 * Which punch methods the tenant allows. Defaults keep web punch enabled while
 * the settings load and if the read fails, so a config blip can't lock people
 * out of punching — the server is the real gate either way.
 */
export type CaptureConfig = {
  /** Governs the mobile app. The web widget reads `webPunch` instead. */
  mobilePunch: boolean;
  webPunch: boolean;
  geoFencing: boolean;
  requireLiveLocation: boolean;
};

export function useAttendanceCapture(enabled = true) {
  const query = useQuery({
    queryKey: ['attendance', 'settings'] as const,
    queryFn: ({ signal }) =>
      api.get<{
        capture?: {
          mobilePunch?: boolean;
          webPunch?: boolean;
          geoFencing?: boolean;
          geoFencingConfig?: { requireLiveLocation?: boolean };
        };
      }>('/attendance/settings', { signal }),
    staleTime: 5 * 60_000,
    enabled,
  });
  const capture: CaptureConfig = query.data
    ? {
        mobilePunch: query.data.capture?.mobilePunch !== false,
        webPunch: query.data.capture?.webPunch !== false,
        geoFencing: Boolean(query.data.capture?.geoFencing),
        requireLiveLocation: Boolean(
          query.data.capture?.geoFencingConfig?.requireLiveLocation,
        ),
      }
    : {
        mobilePunch: true,
        webPunch: true,
        geoFencing: false,
        requireLiveLocation: false,
      };
  // Until the settings resolve, `ready` is false so the card can hold off
  // rather than flashing in and then disappearing when mobile punch is off.
  return { ...query, capture, ready: !enabled || query.isFetched };
}

/**
 * Tenant attendance rules that bear on regularizing, read from the same
 * settings payload — and the same cache entry — the punch card uses.
 *
 * Absent flags mean "on" for requireReason and "off" for the attachment
 * requirement, matching the web's `!== false` / `=== true` reads.
 */
export type AttendanceRules = {
  requireReason: boolean;
  requireRegularizationAttachment: boolean;
  regularizationAttachmentAfterDays: number;
  maxRegularizationsPerMonth: number;
  autoAbsentIfNoPunch: boolean;
};

export function useAttendanceRules(enabled = true) {
  const query = useQuery({
    queryKey: ['attendance', 'settings'] as const,
    queryFn: ({ signal }) =>
      api.get<{ rules?: Partial<Record<keyof AttendanceRules, unknown>> }>(
        '/attendance/settings',
        { signal },
      ),
    staleTime: 5 * 60_000,
    enabled,
  });
  const raw = (query.data as { rules?: Record<string, unknown> } | undefined)
    ?.rules;
  const rules: AttendanceRules = {
    requireReason: raw?.requireReason !== false,
    requireRegularizationAttachment:
      raw?.requireRegularizationAttachment === true,
    regularizationAttachmentAfterDays: Math.max(
      0,
      Number(raw?.regularizationAttachmentAfterDays ?? 0),
    ),
    maxRegularizationsPerMonth: Math.max(
      0,
      Number(raw?.maxRegularizationsPerMonth ?? 0),
    ),
    autoAbsentIfNoPunch: raw?.autoAbsentIfNoPunch === true,
  };
  return { ...query, rules };
}

/** One day of the month grid, as GET /attendance/me/month returns it. */
export type MonthDay = {
  day: number;
  status?: string | null;
  /** Payroll period lock for this exact date. */
  locked?: boolean;
  /** Punched in with no punch-out yet. */
  open?: boolean;
  /** Off-day context when a real entry exists on a holiday/week-off. */
  context?: 'HOLIDAY' | 'WO' | null;
  /** True when a comp-off credit exists for working this day. */
  compOff?: boolean;
  /** Night shift — the punch-out on the NEXT calendar day counts here. */
  overnight?: boolean;
  /** Absent because the punch-OUT never came, not a no-show. */
  missedPunch?: boolean;
  /** Punched in after shift start + grace. The day stays Present. */
  late?: boolean;
};

export function useMyMonthDays(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'me-month', year, month] as const,
    queryFn: async ({ signal }) => {
      const data = await api.get<{ days?: MonthDay[] }>(
        `/attendance/me/month?year=${year}&month=${month}`,
        { signal },
      );
      return Array.isArray(data?.days) ? data.days : [];
    },
    staleTime: 60_000,
    enabled,
  });
}

export const attendanceKeys = {
  today: () => ['attendance', 'me'] as const,
  month: (year: number, month: number) =>
    ['attendance', 'month', year, month] as const,
  calendar: (year: number, month: number) =>
    ['attendance', 'calendar', year, month] as const,
};

/**
 * The per-day kind the calendar endpoint computes: attendance entries overlaid
 * with the month's leave/WFH/OD requests, LOP and comp-off flagged separately.
 * Pending requests read "-applied"; approved ones take the solid colour.
 */
export type CalendarDayKind =
  | 'present'
  /** Punched in but not yet out — the day's outcome isn't decided yet. */
  | 'in-progress'
  | 'half'
  | 'absent'
  | 'wfh'
  | 'onduty'
  | 'work-applied'
  | 'leave'
  | 'approved'
  | 'compoff'
  | 'lop'
  /** Regularization request raised for the day, not yet decided. */
  | 'regularization-applied'
  /** An approved regularization corrected this day's times. */
  | 'regularization-approved'
  | (string & {});

export type MonthCalendar = {
  year?: number;
  month?: number;
  statusByDay?: Record<string, CalendarDayKind>;
  leaveTypesByDay?: Record<string, string[]>;
  /** Raw leave state per day ('applied' | 'approved' | 'lop' | 'compoff'). */
  leaveStatusByDay?: Record<string, string>;
  /** WFH/ON_DUTY requests per day — drives the work-request overlap ring. */
  workTypesByDay?: Record<string, string[]>;
};

/**
 * The richer month view the web widget renders from — same GET
 * /attendance/calendar. `month` is 1-12.
 */
export function useAttendanceCalendar(
  year: number,
  month: number,
  enabled = true,
) {
  return useQuery({
    queryKey: attendanceKeys.calendar(year, month),
    queryFn: ({ signal }) =>
      api.get<MonthCalendar>(
        `/attendance/calendar?year=${year}&month=${month}`,
        { signal },
      ),
    staleTime: 60_000,
    enabled,
  });
}

/**
 * Today's entry — null body means no punches yet. The backend also handles
 * night-shift continuity: after midnight an open overnight entry comes back
 * under its own business date so the punched-in state stays true.
 */
export function useTodayAttendance(enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.today(),
    queryFn: ({ signal }) => api.get<AttendanceDay>('/attendance/me', { signal }),
    staleTime: 30_000,
    enabled,
  });
}

/** All entries for one month; `month` is 1-12 as the backend expects. */
export function useMonthAttendance(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.month(year, month),
    queryFn: async ({ signal }) => {
      const rows = await api.get<NonNullable<AttendanceDay>[]>(
        `/attendance/month?year=${year}&month=${month}`,
        { signal },
      );
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 60_000,
    enabled,
  });
}

/**
 * Punch in or out. The backend enforces the office-network restriction from the
 * server-read IP and rejects with a specific message when it applies — surface
 * that message, never a generic one.
 */
export function usePunch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      action: 'PUNCH_IN' | 'PUNCH_OUT';
      /** Sent only when the tenant has geo-fencing on. */
      latitude?: number;
      longitude?: number;
    }) =>
      api.post<AttendanceDay>('/attendance/punch', {
        action: input.action,
        // Declares which capture channel this is, because the server defaults
        // an absent source to WEB: it then enforced the tenant's *web* punch
        // toggle against mobile punches (an enabled button the server would
        // refuse when webPunch was off) and stamped every mobile punch as
        // AttendanceMethod.WEB in reports.
        source: 'MOBILE',
        ...(input.latitude !== undefined && input.longitude !== undefined
          ? { latitude: input.latitude, longitude: input.longitude }
          : {}),
      }),
    onSuccess: (day) => {
      // The punch response IS the resulting business day, so write it straight
      // into the cache: the card flips to its new state on the same tick
      // instead of waiting for /attendance/me to come back. Against a remote
      // database that refetch is what made a punch feel slow even though the
      // punch itself had already committed.
      if (day) queryClient.setQueryData(attendanceKeys.today(), day);
      // Still refresh in the background — /attendance/me carries the wider
      // view (shift context, overnight resolution) and the month/summary
      // feeds need to catch up — but nothing here is awaited, so none of it
      // delays the button.
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today() });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'calendar'] });
    },
  });
}
