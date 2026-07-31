import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    team?: string;
  };
  summary?: string;
  details?: string;
  raisedAt?: string;
  actionedAt?: string;
  decisionNote?: string;
  autoApproved?: boolean;
  meta?: { label: string; value: string }[];
};

export const approvalKeys = {
  manager: () => ['approvals', 'manager'] as const,
};

/** All three slices at once, so the status tabs carry real counts. */
export function useManagerApprovals(enabled = true) {
  return useQuery({
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
