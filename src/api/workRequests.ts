import { useQuery } from '@tanstack/react-query';

import { api } from './client';


export type WorkRequestCategory = 'WFH' | 'OD';

export type WorkRequestAllowance = {
  /** Days left in the current period, or null when uncapped/unknown. */
  remaining: number | null;
  period: 'WEEKLY' | 'MONTHLY';
};

/** yyyy-mm-dd in local time — the period is resolved from this date. */
function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export const workRequestKeys = {
  balance: (category: WorkRequestCategory, date: string) =>
    ['work-requests', 'balance', category, date] as const,
};

/**
 * The allowance for one category on one date. Limits can differ per period, so
 * the date matters: asking about next month can give a different answer.
 */
export function useWorkRequestAllowance(
  category: WorkRequestCategory,
  date: Date | null,
  enabled = true,
) {
  const key = isoDate(date ?? new Date());

  return useQuery({
    queryKey: workRequestKeys.balance(category, key),
    queryFn: async ({ signal }) => {
      const result = await api.get<{
        wfmRemaining?: number | null;
        wfmLimitPeriod?: string;
      }>(
        `/requests/mine/work-request-balance?category=${category}&date=${key}`,
        { signal },
      );
      return {
        remaining:
          typeof result?.wfmRemaining === 'number' ? result.wfmRemaining : null,
        period: result?.wfmLimitPeriod === 'WEEKLY' ? 'WEEKLY' : 'MONTHLY',
      } satisfies WorkRequestAllowance;
    },
    staleTime: 60_000,
    enabled,
  });
}
