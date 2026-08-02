import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from './client';
import { leaveKeys } from './leave';

/**
 * Submitting a request — the same POST /requests the web's apply pages use,
 * for all three categories.
 *
 * The server is the authority on policy: it re-checks overlap, balance
 * (including days held by pending requests), notice periods, attachment rules
 * and off-day-only ranges, and answers with a specific reason. That message is
 * surfaced verbatim rather than replaced with a generic failure — the client's
 * pre-checks exist to fail fast, not to be the last word.
 */

export type RequestCategory = 'LEAVE' | 'REGULARIZATION' | 'WFH' | 'OD';

/** A stored attachment descriptor, as the upload endpoint returns it. */
export type StoredAttachment = {
  name: string;
  size: number;
  mimeType: string;
  filePath: string;
};

export type SubmitRequestBody = {
  category: RequestCategory;
  /** Human-readable type, e.g. the leave type's name or "Missed punch". */
  type: string;
  /** yyyy-mm-dd */
  startDate: string;
  endDate: string;
  reason: string;
  leaveTypeId?: string;
  leaveTypeCode?: string;
  dayCount?: number;
  fromSession?: string;
  toSession?: string;
  /** Required by the server before it will book over-balance days as LOP. */
  acceptLop?: boolean;
  attachment?: StoredAttachment;
};

/** Uploads a picked file and returns the descriptor the request body expects. */
export async function uploadRequestAttachment(file: {
  uri: string;
  name: string;
  mimeType?: string | null;
}): Promise<StoredAttachment> {
  const form = new FormData();
  // React Native's FormData takes this {uri,name,type} shape for files.
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  } as unknown as Blob);
  return api.post<StoredAttachment>('/requests/attachments', form);
}

/** Turns a failed request into the server's own wording where there is one. */
export function requestErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to submit request. Try again.';
}

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitRequestBody) => api.post('/requests', body),
    onSuccess: () => {
      // A new request changes the overlap markers, the balances and every
      // feed that lists requests.
      queryClient.invalidateQueries({ queryKey: leaveKeys.myLeave() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['leave', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      // 'work-requests' (hyphenated) is the real key prefix — see
      // src/api/workRequests.ts. The old camelCase key matched nothing, so
      // the WFH/OD remaining-allowance tiles kept serving their cached count
      // after a submit, and the client-side cap pre-check ran against it.
      queryClient.invalidateQueries({ queryKey: ['work-requests'] });
    },
  });
}
