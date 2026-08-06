import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { api } from './client';

/**
 * The manager approvals queue — the same endpoints the web panel's Approvals
 * page uses. When auto-approve is off, every request (leave, regularization,
 * WFH/OD, comp-off, optional-holiday claims, cancellations) lands here as a
 * pending row for the reporting manager to decide.
 */

export type ServerApprovalKind =
  | 'leave'
  | 'regularize'
  | 'wfh'
  | 'od'
  | 'cancellation'
  | 'compoff'
  | 'optholiday'
  | 'overtime'
  | 'shiftswap'
  | (string & {});

export type ServerApprovalRow = {
  id: string;
  requestId?: string;
  kind: ServerApprovalKind;
  requester?: {
    id?: string;
    name?: string;
    designation?: string;
    /** Both carry the employee's department. The leave family sends only
     *  `department`; comp-off / overtime / optional-holiday send both, with
     *  the same value — so they must be deduped, never concatenated. */
    team?: string;
    department?: string;
  };
  summary?: string;
  details?: string;
  raisedAt?: string;
  actionedAt?: string;
  decisionNote?: string;
  autoApproved?: boolean;
  meta?: { label: string; value: string }[];
  /** What approving actually does. The feed has always sent these; the app
   *  ignored them and asserted "Your decision completes this request." on
   *  every row, including ones that still need an HR step after yours. */
  route?: 'manager_final' | 'manager_then_hr' | 'policy_exception';
  routeNote?: string;
  /** Set when the step lapsed past the tenant's escalation window. Nobody
   *  performs the escalation — this names the step, not an actor. */
  escalation?: {
    stepLabel?: string;
    at?: string;
    reason?: string;
  };
};

export const approvalKeys = {
  manager: () => ['approvals', 'manager'] as const,
};

/** All three slices at once, so the status tabs carry real counts. */
export function useManagerApprovals(enabled = true) {
  const query = useQuery({
    queryKey: approvalKeys.manager(),
    queryFn: ({ signal }) =>
      api.get<{
        pending?: ServerApprovalRow[];
        approved?: ServerApprovalRow[];
        rejected?: ServerApprovalRow[];
      }>('/requests/manager/approvals?status=all', { signal }),
    staleTime: 30_000,
    enabled,
  });

  // Tab screens stay mounted, so without this a request the employee
  // withdrew while the manager was on another tab kept showing as pending
  // until the app was backgrounded. The server already drops withdrawn rows;
  // this just asks it again whenever the queue comes back on screen.
  const { refetch } = query;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      // Mount already fetches; only re-focus needs the extra ask.
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (enabled) void refetch();
    }, [enabled, refetch]),
  );

  return query;
}

/**
 * Comp-off, optional holidays, overtime and shift swaps decide on their own
 * endpoints; cancellations on the request's cancellation route; everything
 * else on /requests/:id/status — the web's statusEndpoint(), ported.
 */
function decisionEndpoint(row: ServerApprovalRow): string {
  const id = row.requestId ?? row.id;
  switch (row.kind) {
    case 'cancellation':
      return `/requests/${id}/cancellation`;
    case 'compoff':
      return `/requests/comp-off/${id}/status`;
    case 'optholiday':
      return `/requests/optional-holidays/${id}/status`;
    case 'overtime':
      return `/attendance/overtime/${id}/status`;
    case 'shiftswap':
      return `/attendance/shifts/swaps/${id}/status`;
    default:
      return `/requests/${id}/status`;
  }
}

/** Cancellation reviews take {approve, comment}; the rest {status, comment}. */
function decisionBody(row: ServerApprovalRow, approve: boolean, comment: string) {
  if (row.kind === 'cancellation') return { approve, comment };
  return { status: approve ? 'APPROVED' : 'REJECTED', comment };
}

export function useDecideApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      row: ServerApprovalRow;
      approve: boolean;
      comment?: string;
    }) =>
      api.patch(
        decisionEndpoint(input.row),
        decisionBody(input.row, input.approve, input.comment ?? ''),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.manager() });
    },
  });
}
