/**
 * Leave policy rules, ported from the web panel's apply-leave page
 * (src/app/modules/leave/applyleave/page.tsx).
 *
 * Kept as pure functions so the same inputs always give the same answer and the
 * rules can be exercised without a running app. The screen only renders what
 * these return.
 *
 * The server recomputes the authoritative day count on submit and rejects with
 * a specific message, so a divergent client estimate must never block a request
 * that would have been valid — which is why over-balance and max-consecutive
 * are warnings here, not blockers.
 */

export type LeaveSession = 'full' | 'first-half' | 'second-half';

/** Tenant rules from GET /requests/settings, narrowed to what applying needs. */
export type LeavePolicySettings = {
  calendar: {
    excludeWeekends: boolean;
    excludeHolidays: boolean;
    halfDayAllowed: boolean;
    /** 0 = Sunday … 6 = Saturday. Defaults to the weekend when unset. */
    weekOffDays: number[];
  };
  balances: {
    allowNegativeBalance: boolean;
    negativeBalanceLimit: number;
  };
  workflow: {
    requireReason: boolean;
    requireAttachment: boolean;
    /** Attachment kicks in above this many days; 0 = always. */
    requireAttachmentAfterDays: number;
    restrictPastApplication: boolean;
    pastApplicationDays: number;
  };
};

export const DEFAULT_LEAVE_POLICY: LeavePolicySettings = {
  calendar: {
    excludeWeekends: true,
    excludeHolidays: true,
    halfDayAllowed: true,
    weekOffDays: [0, 6],
  },
  balances: { allowNegativeBalance: false, negativeBalanceLimit: 0 },
  workflow: {
    requireReason: true,
    requireAttachment: false,
    requireAttachmentAfterDays: 0,
    restrictPastApplication: false,
    pastApplicationDays: 0,
  },
};

/** The selected type's rules that bear on counting and limits. */
export type LeaveTypeRules = {
  paid: boolean;
  /** Counts intervening week-offs/holidays as leave when true. */
  sandwichRule: boolean;
  /** 0 or undefined = no cap. */
  maxConsecutiveDays: number;
};

export type ExistingLeaveRange = {
  id: string;
  /** yyyy-mm-dd */
  startDate: string;
  endDate: string;
  type?: string;
};

/** yyyy-mm-dd in local time — never toISOString, which shifts across midnight. */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** A single day's contribution: 1, or 0.5 when half-days are on. */
export function sessionValue(
  session: LeaveSession,
  halfDayAllowed: boolean,
): number {
  if (!halfDayAllowed) return 1;
  return session === 'full' ? 1 : 0.5;
}

/** From and to land on the same day — two halves only count as 0.5 if identical. */
export function sameDaySessionValue(
  fromSession: LeaveSession,
  toSession: LeaveSession,
  halfDayAllowed: boolean,
): number {
  if (!halfDayAllowed || fromSession === 'full' || toSession === 'full') return 1;
  return fromSession === toSession ? 0.5 : 1;
}

export type CountInput = {
  from: Date | null;
  to: Date | null;
  fromSession: LeaveSession;
  toSession: LeaveSession;
  settings: LeavePolicySettings;
  type: LeaveTypeRules | null;
  /** yyyy-mm-dd keys of non-optional holidays. */
  holidayKeys: Set<string>;
};

/**
 * Chargeable days in the range. Week-offs and holidays drop out unless the type
 * carries a sandwich rule, in which case every day in between counts.
 */
export function countLeaveDays(input: CountInput): number | null {
  const { from, to, settings, type, holidayKeys } = input;
  if (!from || !to) return null;

  const start = atMidnight(from);
  const end = atMidnight(to);
  if (end < start) return null;

  const weekOffs = new Set(settings.calendar.weekOffDays);
  const startKey = dateKey(start);
  const endKey = dateKey(end);

  let total = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = dateKey(cursor);
    const skip =
      !type?.sandwichRule &&
      ((settings.calendar.excludeWeekends && weekOffs.has(cursor.getDay())) ||
        (settings.calendar.excludeHolidays && holidayKeys.has(key)));

    if (!skip) {
      const isStart = key === startKey;
      const isEnd = key === endKey;
      if (isStart && isEnd) {
        total += sameDaySessionValue(
          input.fromSession,
          input.toSession,
          settings.calendar.halfDayAllowed,
        );
      } else if (isStart) {
        total += sessionValue(input.fromSession, settings.calendar.halfDayAllowed);
      } else if (isEnd) {
        total += sessionValue(input.toSession, settings.calendar.halfDayAllowed);
      } else {
        total += 1;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return total > 0 ? Math.max(0.5, total) : 0;
}

/** The first request whose range touches [from, to], or null. */
export function findOverlap(
  requests: ExistingLeaveRange[],
  from: Date | null,
  to: Date | null,
): ExistingLeaveRange | null {
  if (!from || !to) return null;
  const fromKey = dateKey(atMidnight(from));
  const toKey = dateKey(atMidnight(to));
  return (
    requests.find(
      (request) => request.startDate <= toKey && request.endDate >= fromKey,
    ) ?? null
  );
}

export type PolicyEvaluation = {
  /** Chargeable days, or null while the range is incomplete. */
  totalDays: number | null;
  /** Days payroll treats as loss of pay — the excess over the balance. */
  lopDays: number;
  paidDays: number;
  /** Balance left if this request goes through; null for unpaid/unknown. */
  remainingAfter: number | null;
  /** Must be cleared before submitting. */
  blockers: string[];
  /** Worth showing, but the server has the final say. */
  warnings: string[];
  /** True when an attachment is mandatory for this request. */
  attachmentRequired: boolean;
  /** The employee must acknowledge unpaid days before submitting. */
  needsLopAcknowledgement: boolean;
  overlap: ExistingLeaveRange | null;
};

export type EvaluateInput = CountInput & {
  /** Remaining balance for the selected type, or null when it has none. */
  balanceRemaining: number | null;
  maxConsecutiveDays?: number;
  reason: string;
  hasAttachment: boolean;
  existingRequests: ExistingLeaveRange[];
  /** Injected so the result is deterministic and testable. */
  today: Date;
};

/** Everything the apply screen needs to decide what to show and whether to submit. */
export function evaluateLeaveRequest(input: EvaluateInput): PolicyEvaluation {
  const { settings, type, balanceRemaining, today } = input;
  const totalDays = countLeaveDays(input);
  const blockers: string[] = [];
  const warnings: string[] = [];

  // Balances are debited at submission, so `remaining` already excludes days
  // held by requests awaiting approval — no separate pending adjustment.
  const allowedBalance =
    balanceRemaining === null
      ? 0
      : Math.max(
          0,
          balanceRemaining +
            (settings.balances.allowNegativeBalance
              ? settings.balances.negativeBalanceLimit
              : 0),
        );

  // Only a paid type with a balance row can produce LOP — an unpaid type is
  // loss of pay by definition, and a type with no balance has nothing to exceed.
  const canOverdraw = Boolean(type?.paid) && balanceRemaining !== null;
  const excess = canOverdraw && totalDays ? totalDays - allowedBalance : 0;
  const lopDays = excess > 0 ? Math.round(excess * 2) / 2 : 0;
  const paidDays = Math.max(0, (totalDays ?? 0) - lopDays);

  const remainingAfter =
    type?.paid && balanceRemaining !== null && totalDays
      ? Math.max(0, balanceRemaining - totalDays)
      : null;

  // ---- Blocking ----
  const oldestAllowed = atMidnight(today);
  oldestAllowed.setDate(
    oldestAllowed.getDate() - settings.workflow.pastApplicationDays,
  );
  if (
    settings.workflow.restrictPastApplication &&
    input.from &&
    atMidnight(input.from) < oldestAllowed
  ) {
    blockers.push(
      settings.workflow.pastApplicationDays > 0
        ? `Leave can only be applied up to ${settings.workflow.pastApplicationDays} day(s) in the past.`
        : 'Leave cannot be applied for a past date.',
    );
  }

  const overlap = findOverlap(input.existingRequests, input.from, input.to);
  if (overlap) {
    blockers.push('You already have a leave request covering these dates.');
  }

  // Master toggle on, and above the "required after N days" threshold (0 = always).
  const attachmentRequired = Boolean(
    settings.workflow.requireAttachment &&
      totalDays &&
      totalDays > settings.workflow.requireAttachmentAfterDays,
  );
  if (attachmentRequired && !input.hasAttachment) {
    blockers.push('An attachment is required for a request this long.');
  }

  if (settings.workflow.requireReason && !input.reason.trim()) {
    blockers.push('Please provide a reason for your leave application.');
  }

  // ---- Warnings (server decides) ----
  const cap = input.maxConsecutiveDays ?? 0;
  if (cap > 0 && totalDays && totalDays > cap) {
    warnings.push(`This type allows at most ${cap} consecutive day(s).`);
  }
  if (lopDays > 0) {
    warnings.push(
      `${lopDays} day(s) exceed your balance and will be treated as loss of pay.`,
    );
  }
  if (type?.paid === false && totalDays) {
    warnings.push('This leave type is unpaid.');
  }

  return {
    totalDays,
    lopDays,
    paidDays,
    remainingAfter,
    blockers,
    warnings,
    attachmentRequired,
    needsLopAcknowledgement: lopDays > 0,
    overlap,
  };
}
