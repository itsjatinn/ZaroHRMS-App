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
} | null;

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
  | 'half'
  | 'absent'
  | 'wfh'
  | 'onduty'
  | 'work-applied'
  | 'leave'
  | 'approved'
  | 'compoff'
  | 'lop'
  | (string & {});

export type MonthCalendar = {
  year?: number;
  month?: number;
  statusByDay?: Record<string, CalendarDayKind>;
  leaveTypesByDay?: Record<string, string[]>;
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
    mutationFn: (action: 'PUNCH_IN' | 'PUNCH_OUT') =>
      api.post<AttendanceDay>('/attendance/punch', { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today() });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'month'] });
    },
  });
}
