import { findNodeHandle } from 'react-native';

/**
 * Node handle for a focused input, as required by the keyboard-avoidance
 * scroll (`scrollResponderScrollNativeHandleToKeyboard`).
 *
 * Split per platform because react-native-web's findNodeHandle does not return
 * null — it throws: "findNodeHandle is not supported on web. Use the ref
 * property on the component instead." Called straight from an input's onFocus,
 * that crashed the screen the moment a Reason or Search field was tapped.
 */
export function focusTargetHandle(
  instance: Parameters<typeof findNodeHandle>[0],
): number | null {
  return findNodeHandle(instance);
}
