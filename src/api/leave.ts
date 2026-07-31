import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { LeaveType } from '../components/leave/leaveData';
import {
  DEFAULT_LEAVE_POLICY,
  type ExistingLeaveRange,
  type LeavePolicySettings,
} from '../components/leave/leavePolicy';
import { api } from './client';

/**
 * Leave types for the apply form. They are tenant-configured, so they come from
 * the server rather than a local list — same as the web panel's apply-leave
 * page (src/app/modules/leave/applyleave/page.tsx).
 */

export type Gender = 'ALL' | 'MALE' | 'FEMALE' | (string & {});

export type ApiLeaveType = {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
  applicableGender?: Gender;
  /** Hides the BALANCE CARD only — see the filter note below. */
  visibleToEmployees?: boolean;
  /** Unpaid types are loss of pay by definition and never produce LOP days. */
  paid?: boolean;
  /** 0 or absent = no cap on a single stretch. */
  maxConsecutiveDays?: number;
};

export type LeaveBalanceRow = {
  id: string;
  code: string;
  name: string;
  total: number;
  used: number;
  available: number;
};

/** The settings payload, narrowed to the parts applying for leave depends on. */
type RequestSettings = {
  leaveTypes?: ApiLeaveType[];
  calendar?: {
    /** Attendance settings → Rules master switch for regularization. */
    regularizationEnabled?: boolean;
    workFromHomeEnabled?: boolean;
    onDutyEnabled?: boolean;
    excludeWeekends?: boolean;
    excludeHolidays?: boolean;
    halfDayAllowed?: boolean;
    weekOffDays?: number[];
  };
  balances?: {
    allowNegativeBalance?: boolean;
    negativeBalanceLimit?: number;
  };
  workflow?: {
    requireReason?: boolean;
    requireAttachment?: boolean;
    requireAttachmentAfterDays?: number;
    restrictPastApplication?: boolean;
    pastApplicationDays?: number;
    /** Per-category attachment rules for WFH / On Duty. */
    requireWfhAttachment?: boolean;
    wfhAttachmentAfterDays?: number;
    requireOdAttachment?: boolean;
    odAttachmentAfterDays?: number;
  };
};

export const leaveKeys = {
  settings: () => ['leave', 'settings'] as const,
  summary: () => ['leave', 'mine', 'summary'] as const,
  myLeave: () => ['leave', 'mine', 'requests'] as const,
};

export function useLeaveSettings(enabled = true) {
  return useQuery({
    queryKey: leaveKeys.settings(),
    queryFn: ({ signal }) =>
      api.get<RequestSettings>('/requests/settings', { signal }),
    staleTime: 5 * 60_000,
    enabled,
  });
}

/**
 * Statuses that still hold their dates. A rejected or cancelled request has
 * released them, so it must not block re-applying — the web filters the same
 * three.
 */
const BLOCKING_STATUSES = new Set([
  'PENDING',
  'APPROVED',
  'CANCELLATION_REQUESTED',
]);

/** Existing leave requests, used to block overlapping dates. */
export function useMyLeaveRequests(enabled = true) {
  return useQuery({
    queryKey: leaveKeys.myLeave(),
    queryFn: async ({ signal }) => {
      const rows = await api.get<
        (ExistingLeaveRange & { status?: string })[]
      >('/requests/mine?category=LEAVE', { signal });
      if (!Array.isArray(rows)) return [] as ExistingLeaveRange[];
      return rows
        .filter((row) =>
          BLOCKING_STATUSES.has(String(row.status ?? '').toUpperCase()),
        )
        .map((row) => ({
          id: row.id,
          type: row.type,
          startDate: String(row.startDate ?? '').slice(0, 10),
          endDate: String(row.endDate ?? row.startDate ?? '').slice(0, 10),
        }))
        .filter((row) => row.id && row.startDate && row.endDate);
    },
    staleTime: 60_000,
    enabled,
  });
}

/**
 * Tenant rules in the shape the policy functions expect, with the app's
 * defaults filling any gap. Every field is optional on the wire, and a missing
 * flag must not silently flip a rule — so each falls back to DEFAULT_LEAVE_POLICY.
 */
/**
 * Regularization master switch (Attendance settings → Rules), read from the
 * same settings payload — and the same cache entry — the web widget uses.
 * Absent means on: only an explicit false disables it.
 */
export function useRegularizationEnabled(enabled = true): boolean {
  const settings = useLeaveSettings(enabled);
  return settings.data?.calendar?.regularizationEnabled !== false;
}

export function useLeavePolicySettings(enabled = true): LeavePolicySettings {
  const settings = useLeaveSettings(enabled);

  return useMemo(() => {
    const data = settings.data;
    const base = DEFAULT_LEAVE_POLICY;
    const pick = <T,>(value: T | undefined, fallback: T): T =>
      value === undefined || value === null ? fallback : value;

    return {
      calendar: {
        excludeWeekends: pick(
          data?.calendar?.excludeWeekends,
          base.calendar.excludeWeekends,
        ),
        excludeHolidays: pick(
          data?.calendar?.excludeHolidays,
          base.calendar.excludeHolidays,
        ),
        halfDayAllowed: pick(
          data?.calendar?.halfDayAllowed,
          base.calendar.halfDayAllowed,
        ),
        weekOffDays: data?.calendar?.weekOffDays?.length
          ? data.calendar.weekOffDays
          : base.calendar.weekOffDays,
      },
      balances: {
        allowNegativeBalance: pick(
          data?.balances?.allowNegativeBalance,
          base.balances.allowNegativeBalance,
        ),
        negativeBalanceLimit: pick(
          data?.balances?.negativeBalanceLimit,
          base.balances.negativeBalanceLimit,
        ),
      },
      workflow: {
        // requireReason defaults ON — the web treats only an explicit false as off.
        requireReason: data?.workflow?.requireReason !== false,
        requireAttachment: pick(
          data?.workflow?.requireAttachment,
          base.workflow.requireAttachment,
        ),
        requireAttachmentAfterDays: pick(
          data?.workflow?.requireAttachmentAfterDays,
          base.workflow.requireAttachmentAfterDays,
        ),
        restrictPastApplication: pick(
          data?.workflow?.restrictPastApplication,
          base.workflow.restrictPastApplication,
        ),
        pastApplicationDays: pick(
          data?.workflow?.pastApplicationDays,
          base.workflow.pastApplicationDays,
        ),
      },
    };
  }, [settings.data]);
}

export function useMyLeaveSummary(enabled = true) {
  return useQuery({
    queryKey: leaveKeys.summary(),
    queryFn: ({ signal }) =>
      api.get<{
        year?: number;
        gender?: string | null;
        balances?: LeaveBalanceRow[];
      }>('/requests/mine/summary', { signal }),
    staleTime: 60_000,
    enabled,
  });
}

/**
 * The leave types this employee may actually apply for, paired with their
 * remaining balance. Reproduces the web's rules exactly:
 *
 * - inactive types are dropped;
 * - a type restricted to MALE / FEMALE is shown only to a matching employee, so
 *   nobody is offered maternity/paternity that doesn't apply to them;
 * - `visibleToEmployees` is deliberately NOT a filter. It only hides the
 *   balance card on the dashboard — a hidden type is still applyable (that is
 *   how maternity/paternity behave), so filtering on it would wrongly remove
 *   types people need.
 */
export function useApplicableLeaveTypes(enabled = true) {
  const settings = useLeaveSettings(enabled);
  const summary = useMyLeaveSummary(enabled);

  const types = useMemo<LeaveType[]>(() => {
    const rows = settings.data?.leaveTypes;
    if (!Array.isArray(rows)) return [];

    const gender = summary.data?.gender ?? null;
    const balances = summary.data?.balances ?? [];
    const balanceById = new Map(balances.map((row) => [row.id, row]));
    const balanceByCode = new Map(
      balances.map((row) => [String(row.code ?? '').toUpperCase(), row]),
    );

    return rows
      .filter((row) => {
        if (row.isActive === false) return false;
        const applicable = row.applicableGender;
        if ((applicable === 'MALE' || applicable === 'FEMALE') && gender) {
          return gender === applicable;
        }
        return true;
      })
      .map((row) => {
        const balance =
          balanceById.get(row.id) ??
          balanceByCode.get(String(row.code ?? '').toUpperCase());
        const name = row.name || row.code || 'Leave';
        return {
          key: row.id,
          label: name,
          // The dropdown shows the full configured name — trimming it locally
          // would invent labels HR never wrote.
          short: name,
          remaining: Math.max(0, Number(balance?.available ?? 0)),
          // Only an explicit false makes a type unpaid.
          paid: row.paid !== false,
          maxConsecutiveDays: Math.max(0, Number(row.maxConsecutiveDays ?? 0)),
          /**
           * The employee settings payload deliberately omits `sandwichRule`
           * (see getEmployeeSettings) — the web can't read it either, so
           * neither product applies it client-side. The server applies it
           * authoritatively when it recomputes the day count on submit.
           */
          sandwichRule: false,
        };
      });
  }, [settings.data, summary.data]);

  return {
    types,
    isPending: settings.isPending || summary.isPending,
    isError: settings.isError || summary.isError,
  };
}

/**
 * HR toggles and attachment rules for WFH / On Duty requests, from the same
 * leave-settings payload the web's work-request page reads.
 *
 * Each flag defaults to permissive while settings load: only an explicit
 * `false` disables a category, and the attachment requirement needs an
 * explicit `true`. The server enforces all of it regardless.
 */
export type WorkRequestPolicy = {
  wfhEnabled: boolean;
  odEnabled: boolean;
  requireReason: boolean;
  attachment: Record<'WFH' | 'OD', { required: boolean; afterDays: number }>;
};

export const DEFAULT_WORK_REQUEST_POLICY: WorkRequestPolicy = {
  wfhEnabled: true,
  odEnabled: true,
  requireReason: true,
  attachment: {
    WFH: { required: false, afterDays: 0 },
    OD: { required: false, afterDays: 0 },
  },
};

export function useWorkRequestPolicy(enabled = true): WorkRequestPolicy {
  const { data } = useLeaveSettings(enabled);
  return useMemo(() => {
    if (!data) return DEFAULT_WORK_REQUEST_POLICY;
    const calendar = data.calendar ?? {};
    const workflow = data.workflow ?? {};
    return {
      wfhEnabled: calendar.workFromHomeEnabled !== false,
      odEnabled: calendar.onDutyEnabled !== false,
      requireReason: workflow.requireReason !== false,
      attachment: {
        WFH: {
          required: workflow.requireWfhAttachment === true,
          afterDays: Math.max(0, Number(workflow.wfhAttachmentAfterDays ?? 0)),
        },
        OD: {
          required: workflow.requireOdAttachment === true,
          afterDays: Math.max(0, Number(workflow.odAttachmentAfterDays ?? 0)),
        },
      },
    };
  }, [data]);
}

/**
 * Is an attachment mandatory for this request? The master toggle must be on,
 * and either it always applies (0 days) or the request runs longer than the
 * threshold — the same shape as the leave rule.
 */
export function isWorkAttachmentRequired(
  policy: WorkRequestPolicy,
  category: 'WFH' | 'OD',
  days: number,
): boolean {
  const rule = policy.attachment[category];
  if (!rule.required) return false;
  if (rule.afterDays <= 0) return true;
  return days > rule.afterDays;
}

/**
 * The employee's regularization requests, reduced to what the apply screen
 * needs: the date each one covers and whether it still holds that date.
 *
 * Rejected and cancelled requests release the day, so they neither block a
 * duplicate nor count toward the monthly cap.
 */
export type MyRegularization = {
  id: string;
  /** yyyy-mm-dd of the day being regularized. */
  date: string;
  /** Pending or approved — still holds the day. */
  blocking: boolean;
};

export function useMyRegularizations(enabled = true) {
  return useQuery({
    queryKey: ['leave', 'mine', 'regularizations'] as const,
    queryFn: async ({ signal }) => {
      const rows = await api.get<
        { id: string; startDate?: string; status?: string }[]
      >('/requests/mine?category=REGULARIZATION', { signal });
      if (!Array.isArray(rows)) return [] as MyRegularization[];
      return rows
        .map((row) => {
          const status = String(row.status ?? '').toUpperCase();
          return {
            id: row.id,
            date: String(row.startDate ?? '').slice(0, 10),
            blocking: status === 'PENDING' || status === 'APPROVED',
          };
        })
        .filter((row) => row.id && row.date);
    },
    staleTime: 60_000,
    enabled,
  });
}

/** One leave request as the requests feed returns it. */
export type MyLeaveRequest = {
  id: string;
  category?: string;
  /**
   * The server's own label: the leave type's name, or the humanized category
   * ("Regularization", "Work From Home", "On Duty") when there is no leave
   * type. Reconstructing this client-side is what labelled every
   * regularization as "Leave".
   */
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  dayCount?: number;
  reason?: string;
  /** Reason with the attachment metadata stripped — what the web displays. */
  displayReason?: string;
  /** ISO timestamp of the decision (approval/rejection); null while pending. */
  actionedAt?: string | null;
  leaveType?: { name?: string; code?: string } | null;
  decisionNote?: string | null;
  createdAt?: string;
};

/** Every request this employee has raised, newest first. */
export function useMyRequests(enabled = true) {
  return useQuery({
    queryKey: ['leave', 'mine', 'all-requests'],
    queryFn: async ({ signal }) => {
      const rows = await api.get<MyLeaveRequest[]>('/requests/mine', { signal });
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 60_000,
    enabled,
  });
}

/**
 * Withdraw / cancel one of the employee's own requests.
 *
 * POST :id/cancel is the employee's own action (requests.controller.ts
 * `cancelRequest` → `cancelMine`). The similarly named PATCH
 * :id/cancellation is the manager's DECISION on such a request and takes
 * `{ approve, comment }` — calling it as the employee fails, and its absent
 * `approve` field would read as a rejection. approvals.ts uses that one,
 * correctly.
 */
export function useCancelMyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; reason: string }) =>
      api.post(`/requests/${input.id}/cancel`, {
        reason: input.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
  });
}
