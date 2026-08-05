/**
 * Web has no node handles — and nothing to feed them to. The React Native
 * `Keyboard` events that drive the avoidance scroll never fire in a browser,
 * and `scrollResponderScrollNativeHandleToKeyboard` does not exist on
 * react-native-web either; the browser scrolls a focused field into view by
 * itself.
 *
 * Reporting "no target" lets each caller's `if (!target) return` guard take
 * over, so the whole path is a clean no-op here instead of a crash.
 */
export function focusTargetHandle(_instance?: unknown): number | null {
  return null;
}
