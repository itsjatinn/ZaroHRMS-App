import { Text } from 'react-native';

import { isReasonNearLimit, REASON_MAX_LENGTH } from './requestReason';

/**
 * "123/500 characters" under a reason field, turning amber near the ceiling —
 * the web's regularize-form__char-count. Shared so all three request forms
 * count the same way.
 */
export default function ReasonCounter({ value }: { value: string }) {
  const near = isReasonNearLimit(value);
  return (
    <Text
      className="mt-1.5 self-end text-xs"
      style={{ color: near ? '#B45309' : '#94A3B8' }}
      accessibilityLiveRegion="polite"
    >
      {value.length}/{REASON_MAX_LENGTH} characters
    </Text>
  );
}
