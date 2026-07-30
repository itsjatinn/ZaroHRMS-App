import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';

/**
 * Pulse check — the one-question mood survey HR publishes to the org.
 *
 * HR authors questions on the web (POST /pulse-widget/questions, HR admin
 * only); whichever is active comes back from /pulse-widget/active, so anything
 * they ask shows up here without app changes. Mirrors the web panel's
 * GreetingWidget (backend/src/pulse-widget/pulse-widget.controller.ts).
 */

export type PulseReaction = { emoji: string; label: string };

export type PulseQuestion = {
  id: string;
  question: string;
  isActive: boolean;
  createdAt: string;
};

export type PulseResponse = {
  emoji: string;
  label: string;
  updatedAt: string;
};

export type ActivePulse = {
  question: PulseQuestion;
  /** Server-defined scale — render what it sends, not a local list. */
  reactions: PulseReaction[];
  /** This employee's answer to the active question, if they already gave one. */
  response: PulseResponse | null;
};

/**
 * The same five-point scale the backend accepts (it rejects anything else with
 * "Unsupported reaction"). Used only as a fallback before /active answers.
 */
export const DEFAULT_PULSE_REACTIONS: PulseReaction[] = [
  { emoji: '😀', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😟', label: 'Concerned' },
  { emoji: '😫', label: 'Overloaded' },
];

export const pulseKeys = {
  active: () => ['pulse', 'active'] as const,
};

export function useActivePulse(enabled = true) {
  return useQuery({
    queryKey: pulseKeys.active(),
    queryFn: ({ signal }) => api.get<ActivePulse>('/pulse-widget/active', { signal }),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useSubmitPulseReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; emoji: string }) =>
      api.post<PulseResponse>('/pulse-widget/reaction', input),
    onSuccess: (response) => {
      // Patch the cached question in place so the card keeps its selection
      // without a refetch round-trip.
      queryClient.setQueryData<ActivePulse>(pulseKeys.active(), (current) =>
        current ? { ...current, response } : current,
      );
    },
  });
}
