/**
 * Attendance-regularization rules, ported from the web panel's regularize page
 * (src/app/modules/attendance/regularize/page.tsx).
 *
 * Pure functions, like leavePolicy.ts — the screen renders the verdict and never
 * decides policy itself. Checks are returned in the web's own order so the
 * message the employee sees is the same one the web would have shown.
 */

/** Tenant attendance rules, narrowed to what regularizing depends on. */
export type RegularizePolicySettings = {
  /** HR can switch regularization off entirely. */
  enabled: boolean;
  requireReason: boolean;
  requireAttachment: boolean;
  /** Attachment kicks in for days older than this; 0 = always required. */
  attachmentAfterDays: number;
  /** Monthly cap on requests; 0 = unlimited. */
  maxPerMonth: number;
};

export const DEFAULT_REGULARIZE_POLICY: RegularizePolicySettings = {
  enabled: true,
  requireReason: true,
  requireAttachment: false,
  attachmentAfterDays: 0,
  maxPerMonth: 0,
};

/** "09:30" → 570. Null when the value isn't a valid clock time. */
export function minutesFromClock(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * True when the selected day needs supporting evidence: the master toggle is on
 * and either it always applies (0 days) or the day is older than the threshold.
 */
export function isAttachmentRequired(
  settings: RegularizePolicySettings,
  date: Date | null,
  today: Date,
): boolean {
  if (!settings.requireAttachment) return false;
  if (settings.attachmentAfterDays <= 0) return true;
  if (!date) return false;
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ageDays = Math.floor((now.getTime() - day.getTime()) / 86400000);
  return ageDays > settings.attachmentAfterDays;
}

export type RegularizeInput = {
  settings: RegularizePolicySettings;
  type: string | null;
  date: Date | null;
  /** "HH:mm", or empty while unset. */
  inTime: string;
  outTime: string;
  reason: string;
  hasAttachment: boolean;
  /** The day is marked absent — the only state that can be regularized. */
  isAbsent: boolean;
  /** Payroll is locked for the day, so nothing can change. */
  isLocked: boolean;
  /** A pending/approved regularization already covers the day. */
  isDuplicate: boolean;
  /** Requests already filed this month, for the monthly cap. */
  usedThisMonth: number;
  today: Date;
};

export type RegularizeEvaluation = {
  /** Ordered; the first is the one to show. Empty means submittable. */
  blockers: string[];
  attachmentRequired: boolean;
  limitReached: boolean;
  /** Requests left this month, or null when unlimited. */
  remainingThisMonth: number | null;
};

export function evaluateRegularization(
  input: RegularizeInput,
): RegularizeEvaluation {
  const { settings } = input;
  const blockers: string[] = [];

  const limitReached =
    settings.maxPerMonth > 0 && input.usedThisMonth >= settings.maxPerMonth;
  const remainingThisMonth =
    settings.maxPerMonth > 0
      ? Math.max(0, settings.maxPerMonth - input.usedThisMonth)
      : null;
  const attachmentRequired = isAttachmentRequired(
    settings,
    input.date,
    input.today,
  );

  if (!settings.enabled) {
    blockers.push('Regularization requests are disabled by HR.');
  }

  if (input.isLocked) {
    blockers.push(
      'Payroll is locked for this date. Regularization is unavailable.',
    );
  }

  if (attachmentRequired && !input.hasAttachment) {
    blockers.push(
      settings.attachmentAfterDays > 0
        ? `An attachment is required to regularize a day older than ${settings.attachmentAfterDays} day(s).`
        : 'An attachment is required for regularization requests.',
    );
  }

  if (limitReached) {
    blockers.push(
      `You've reached the limit of ${settings.maxPerMonth} regularization${
        settings.maxPerMonth === 1 ? '' : 's'
      } for this month.`,
    );
  }

  if (
    !input.type ||
    !input.date ||
    !input.inTime ||
    !input.outTime ||
    (settings.requireReason && !input.reason.trim())
  ) {
    blockers.push('Fill all required fields to submit.');
  }

  if (!input.isAbsent) {
    blockers.push('Regularization can be applied only for absent days.');
  }

  const inMinutes = minutesFromClock(input.inTime);
  const outMinutes = minutesFromClock(input.outTime);
  if (input.inTime && input.outTime && (inMinutes === null || outMinutes === null)) {
    blockers.push('Enter valid check-in and check-out times.');
  } else if (
    inMinutes !== null &&
    outMinutes !== null &&
    outMinutes <= inMinutes
  ) {
    blockers.push('Check-out time must be after check-in time.');
  }

  if (input.isDuplicate) {
    blockers.push(
      'You already have a pending/approved regularization for this day.',
    );
  }

  return { blockers, attachmentRequired, limitReached, remainingThisMonth };
}
