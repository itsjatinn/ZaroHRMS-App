import { useQuery } from '@tanstack/react-query';
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

/** Existing leave requests, used to block overlapping dates. */
export function useMyLeaveRequests(enabled = true) {
  return useQuery({
    queryKey: leaveKeys.myLeave(),
    queryFn: async ({ signal }) => {
      const rows = await api.get<ExistingLeaveRange[]>(
        '/requests/mine?category=LEAVE',
        { signal },
      );
      return Array.isArray(rows) ? rows : [];
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
        };
      });
  }, [settings.data, summary.data]);

  return {
    types,
    isPending: settings.isPending || summary.isPending,
    isError: settings.isError || summary.isError,
  };
}
