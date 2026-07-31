import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  Celebration,
  CelebrationKind,
} from '../components/celebrations/celebrationsData';
import { api } from './client';

/**
 * Celebrations across the user's reporting tree — the same endpoints the web
 * panel's employee Celebrations page uses. GET /employees/me/celebrations
 * returns the rows (with per-user `wished` state); wishes post to
 * /employees/me/celebrations/wish with the occasion's identity.
 */

export type WishTarget = {
  employeeId: string;
  kind: CelebrationKind;
  /** Calendar year of the occurrence — part of the wish identity. */
  year: number;
};

/** One key per occasion, so a wish can't be sent twice in a session. */
export function wishKey(target: WishTarget): string {
  return `${target.employeeId}|${target.kind}|${target.year}`;
}

export const celebrationKeys = {
  mine: () => ['celebrations', 'mine'] as const,
};

export function useMyCelebrations(enabled = true) {
  return useQuery({
    queryKey: celebrationKeys.mine(),
    queryFn: async ({ signal }) => {
      const result = await api.get<{ items?: Celebration[] }>(
        '/employees/me/celebrations',
        { signal },
      );
      return Array.isArray(result?.items) ? result.items : [];
    },
    staleTime: 60_000,
    enabled,
  });
}

/**
 * Sends the wish (in-app notification, plus email when the sender is the
 * person's reporting manager). Refreshes the list on success so the server's
 * `wished` flag is correct on the next paint and across reloads.
 */
export function useSendCelebrationWish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WishTarget & { message?: string }) =>
      api.post('/employees/me/celebrations/wish', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: celebrationKeys.mine() });
    },
  });
}
