import { useQuery } from '@tanstack/react-query';

import type { TeamMember, TeamStatus } from '../components/team/teamData';
import { useAuth } from '../auth/AuthContext';
import { api } from './client';

/**
 * The manager's direct reports with today's attendance — the same
 * GET /attendance/team the web's manager views read. Manager-scoped
 * server-side: the reporting lines resolve from the caller's JWT.
 */

type TeamMemberRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  code?: string | null;
  role?: string | null;
  designation?: string | null;
  status?: string | null;
  punchInAt?: string | null;
  punchOutAt?: string | null;
  lateMinutes?: number | null;
  earlyExitMinutes?: number | null;
  /** Approved WFH/OD covering today, when there is one. */
  wfmType?: string | null;
};

/** Backend AttendanceStatus → the roster's four pills. */
function toTeamStatus(row: TeamMemberRow): TeamStatus {
  const status = String(row.status ?? '').toUpperCase();
  if (row.wfmType || status === 'WFH' || status === 'ON_DUTY' || status === 'WO') {
    return 'WFH/WO';
  }
  if (status === 'LEAVE' || status === 'HOLIDAY') return 'On leave';
  if (status === 'ABSENT') return 'Absent';
  // Half day is its own pill, not a flavour of Present. The backend already
  // resolves it from worked hours against the shift's half/full-day
  // thresholds at punch-out; folding it into Present here told a manager
  // someone worked a full day when the server had decided otherwise.
  if (status === 'HALF_DAY') return 'Half day';
  return 'Present';
}

/** "09:14 AM", or an em dash before the stamp exists. */
function stamp(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** "Late 11m" / "Left early 20m" — the same hints the demo roster showed. */
function noteOf(row: TeamMemberRow): string | undefined {
  const late = Math.max(0, Number(row.lateMinutes ?? 0));
  if (late > 0) return `Late ${late}m`;
  const early = Math.max(0, Number(row.earlyExitMinutes ?? 0));
  if (early > 0) return `Left early ${early}m`;
  if (String(row.status ?? '').toUpperCase() === 'ABSENT') return 'No punch';
  return undefined;
}

/**
 * Is this user a manager? The login role alone is not enough: most managers
 * hold a plain EMPLOYEE account role and are managers purely by reporting
 * lines, so the server's is-manager check (the same isCallerAManager the
 * web's dashboard reads) is consulted too. Either signal grants access.
 *
 * `ready` is false while the server check is still in flight for a session
 * whose role alone doesn't already grant access — callers use it to avoid
 * redirecting away from a manager surface prematurely.
 */
export function useIsManager() {
  const { userRole, isBackendSession } = useAuth();
  const roleSaysManager = userRole === 'manager';
  const query = useQuery({
    queryKey: ['team', 'is-manager'] as const,
    queryFn: async ({ signal }) => {
      const result = await api.get<{ isManager?: boolean }>(
        '/employees/me/is-manager',
        { signal },
      );
      return result?.isManager === true;
    },
    staleTime: 5 * 60_000,
    // The role already answers it for demo sessions and explicit managers.
    enabled: isBackendSession && !roleSaysManager,
  });
  return {
    isManager: roleSaysManager || query.data === true,
    ready: !isBackendSession || roleSaysManager || query.isFetched,
  };
}

export function useTeamMembers(enabled = true) {
  return useQuery({
    queryKey: ['team', 'members'] as const,
    queryFn: async ({ signal }) => {
      const data = await api.get<{ members?: TeamMemberRow[] }>(
        '/attendance/team',
        { signal },
      );
      return (data?.members ?? []).map((row): TeamMember => {
        const name = row.name?.trim() || 'Employee';
        return {
          id: row.id,
          initials: initialsOf(name),
          name,
          role: row.designation?.trim() || row.role?.trim() || '—',
          employeeId: row.code?.trim() || row.id,
          email: row.email?.trim() || '',
          status: toTeamStatus(row),
          inTime: stamp(row.punchInAt),
          outTime: stamp(row.punchOutAt),
          note: noteOf(row),
        };
      });
    },
    staleTime: 60_000,
    enabled,
  });
}

/* ----------------------- team attendance (month grid) ---------------------- */

export type TeamAttendanceDay = {
  day: number;
  status?: string | null;
  /** ABSENT because the punch-OUT never came, not a no-show. */
  missedPunch?: boolean;
  /** Punched in after shift start + grace. The day stays Present. */
  late?: boolean;
};

/** GET /attendance/employee/:id/month — same payload the web team calendar reads. */
export type TeamAttendanceMonth = {
  days?: TeamAttendanceDay[];
  counts?: {
    present?: number;
    absent?: number;
    leave?: number;
    wfh?: number;
    od?: number;
    wo?: number;
    halfDay?: number;
    holiday?: number;
  };
  attendancePercent?: number;
};

/**
 * One month of attendance for every team member, keyed by employee id — the
 * same per-employee month endpoint the web's Team Attendance Calendar hits.
 * Fetched together (allSettled) so one member's failure doesn't blank the
 * grid; missing members simply render empty cells.
 */
export function useTeamAttendanceMonths(
  members: TeamMember[],
  year: number,
  month: number,
  enabled = true,
) {
  const memberIds = members
    .map((member) => member.id)
    .sort()
    .join(',');
  return useQuery({
    queryKey: ['team', 'attendance-month', year, month, memberIds] as const,
    queryFn: async ({ signal }) => {
      const results = await Promise.allSettled(
        members.map(async (member) => ({
          id: member.id,
          data: await api.get<TeamAttendanceMonth>(
            `/attendance/employee/${member.id}/month?year=${year}&month=${month}`,
            { signal },
          ),
        })),
      );
      const byId: Record<string, TeamAttendanceMonth> = {};
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data) {
          byId[result.value.id] = result.value.data;
        }
      }
      return byId;
    },
    staleTime: 60_000,
    enabled: enabled && members.length > 0,
  });
}

/* -------------------------- team leave (month bars) ------------------------ */

export type TeamCalendarLeave = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  category: string;
  type: string;
};

export type TeamLeaveCalendar = {
  month: string;
  members?: {
    id: string;
    name: string;
    code?: string | null;
    designation?: string | null;
    leaves?: TeamCalendarLeave[];
  }[];
  holidays?: { date: string; name: string }[];
};

/**
 * The manager team leave calendar — GET /requests/manager/team-calendar, the
 * same feed behind the web panel's team leave view (approved / pending /
 * rejected / cancellation-requested bars plus company holidays).
 */
export function useTeamLeaveCalendar(year: number, month: number, enabled = true) {
  const monthParam = `${year}-${String(month).padStart(2, '0')}`;
  return useQuery({
    queryKey: ['team', 'leave-calendar', monthParam] as const,
    queryFn: ({ signal }) =>
      api.get<TeamLeaveCalendar>(
        `/requests/manager/team-calendar?month=${monthParam}`,
        { signal },
      ),
    staleTime: 60_000,
    enabled,
  });
}
