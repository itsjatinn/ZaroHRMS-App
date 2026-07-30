/**
 * Shared limit for the free-text "Reason" on the apply-leave, attendance
 * regularization and WFH / on-duty forms. All three post to the same
 * CreateRequestDto, so the cap lives in one place — mirroring the web panel's
 * src/utils/requestReason.ts and the @MaxLength on that DTO.
 */
export const REASON_MAX_LENGTH = 150;

/**
 * True once the employee is within `within` characters of the ceiling, so the
 * counter can warn before typing stops. Scaled to the shorter cap — 50 would
 * light up a third of the way in.
 */
export function isReasonNearLimit(value: string, within = 20): boolean {
  return value.length >= REASON_MAX_LENGTH - within;
}
