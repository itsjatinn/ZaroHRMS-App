import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CalendarHoliday, HolidayType } from '../components/holidays/holidayCalendarData';
import { api } from './client';

// Holiday calendar + optional-holiday claims, the same endpoints the web panel's
// Holiday Calendar screen uses (backend/src/requests/requests.controller.ts).

type ApiHoliday = {
  id?: string;
  /** Display date, e.g. "11 Jun 2026". */
  date?: string;
  /** yyyy-mm-dd — present on persisted calendar holidays. */
  isoDate?: string;
  name?: string;
  holidayType?: string;
  type?: string;
  isOptional?: boolean;
};

type CalendarResponse = { year: number; holidays?: ApiHoliday[] };

export type OptionalClaimStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type OptionalHolidayRow = {
  holidayId: string;
  /** yyyy-mm-dd. */
  date: string;
  name: string;
  past: boolean;
  claimStatus: OptionalClaimStatus | null;
  claimId: string | null;
};

export type OptionalHolidayContext = {
  year: string | number;
  quota: number;
  used: number;
  remaining: number;
  autoApprove: boolean;
  holidays: OptionalHolidayRow[];
};

const MONTHS_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

/** Backend holiday types → the app's four calendar types. */
function toHolidayType(holiday: ApiHoliday): HolidayType {
  if (holiday.isOptional) return 'optional';
  const raw = String(holiday.holidayType || holiday.type || '').toLowerCase();
  if (raw === 'optional' || raw === 'restricted') return 'optional';
  if (raw === 'state') return 'state';
  if (raw === 'company') return 'company';
  // NATIONAL, PUBLIC and anything unmapped read as a plain gazetted holiday,
  // which is what the web falls back to as well.
  return 'national';
}

/** Normalises the backend's date shapes (ISO, dd/mm/yyyy, "11 Jun 2026"). */
function toIsoDate(value: string): string | null {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, day, month, year] = slash;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const [day, month, year] = value.split(' ');
  const monthIndex = MONTHS_SHORT.indexOf(String(month).slice(0, 3).toLowerCase());
  if (!day || monthIndex < 0 || !year) return null;
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

const claimKey = (isoDate: string, name: string) =>
  `${isoDate}|${name.trim().toLowerCase()}`;

/**
 * Merges the holiday calendar with the employee's optional-holiday claims into
 * the model the Holiday screen renders. Claim rows are matched on date + name,
 * the same pairing the web uses, so a settings-sourced calendar (which has no
 * holiday ids) still resolves its claims.
 */
export function toCalendarHolidays(
  holidays: ApiHoliday[],
  context?: OptionalHolidayContext | null,
): CalendarHoliday[] {
  const claims = new Map<string, OptionalHolidayRow>();
  for (const row of context?.holidays ?? []) {
    claims.set(claimKey(row.date, row.name), row);
  }

  const mapped = holidays.flatMap<CalendarHoliday>((holiday) => {
    const rawDate = holiday.isoDate || holiday.date;
    const date = rawDate ? toIsoDate(String(rawDate)) : null;
    if (!date) return [];

    const name = String(holiday.name || 'Holiday');
    const type = toHolidayType(holiday);
    const claimRow = claims.get(claimKey(date, name));

    return [
      {
        id: holiday.id || claimRow?.holidayId || `${date}-${name}`,
        name,
        date,
        type,
        claimId: claimRow?.claimId ?? null,
        claim:
          type !== 'optional'
            ? undefined
            : claimRow?.claimStatus === 'APPROVED'
              ? 'approved'
              : claimRow?.claimStatus === 'PENDING'
                ? 'pending'
                : claimRow?.past
                  ? 'closed'
                  : 'open',
      },
    ];
  });

  // The backend can return the same holiday from more than one calendar.
  const unique = new Map<string, CalendarHoliday>();
  for (const holiday of mapped) {
    unique.set(claimKey(holiday.date, holiday.name), holiday);
  }
  return Array.from(unique.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export const holidayKeys = {
  calendar: (year: number) => ['holidays', 'calendar', year] as const,
  optionalContext: () => ['holidays', 'optional-context'] as const,
};

export function useHolidayCalendar(year: number, enabled = true) {
  return useQuery({
    queryKey: holidayKeys.calendar(year),
    queryFn: ({ signal }) =>
      api.get<CalendarResponse>(`/requests/calendar?year=${year}`, { signal }),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useOptionalHolidayContext(enabled = true) {
  return useQuery({
    queryKey: holidayKeys.optionalContext(),
    queryFn: ({ signal }) =>
      api.get<OptionalHolidayContext>('/requests/optional-holidays/context', {
        signal,
      }),
    staleTime: 60_000,
    enabled,
  });
}

/** Claim an optional holiday, or withdraw/cancel an existing claim. */
export function useOptionalHolidayClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { holidayId: string; claimId?: string | null }) =>
      input.claimId
        ? api.post(`/requests/optional-holidays/${input.claimId}/cancel`, {})
        : api.post('/requests/optional-holidays/claim', {
            holidayId: input.holidayId,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}
