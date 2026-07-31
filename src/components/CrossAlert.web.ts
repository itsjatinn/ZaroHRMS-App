import type { AlertButton, AlertOptions } from 'react-native';

// Web replacement for React Native's Alert. react-native-web's own Alert is
// `class Alert { static alert() {} }` — a no-op — so without this the app loses
// every error message on web, and every confirmation button's onPress never
// fires (sign-out and approve/reject look like dead buttons).
//
// Mapped onto the browser's blocking dialogs, which is the closest honest
// equivalent: window.alert for a message, window.confirm for a choice.

/** Joins title and message the way the native dialogs stack them. */
function toText(title: string, message?: string): string {
  return message ? `${title}\n\n${message}` : title;
}

/**
 * `confirm()` offers exactly two outcomes, so a button list is reduced to
 * "the cancelling one" and "the acting one".
 *
 * Native convention marks the opt-out with `style: 'cancel'`. When no button
 * says so, the last button is treated as the cancel — that is where both iOS
 * and Android put it, and it is the safer default to trigger on dismissal.
 */
function split(buttons: AlertButton[]) {
  const cancelIndex = buttons.findIndex((b) => b.style === 'cancel');
  if (cancelIndex !== -1) {
    return {
      cancel: buttons[cancelIndex],
      confirm: buttons.find((_, i) => i !== cancelIndex) ?? buttons[cancelIndex],
    };
  }
  return {
    cancel: buttons[buttons.length - 1],
    confirm: buttons[0],
  };
}

export const Alert = {
  /**
   * Matches React Native's Alert.alert signature. `options` is accepted and
   * ignored — its fields (cancelable, onDismiss, userInterfaceStyle) have no
   * browser equivalent, and dropping it silently keeps call sites identical
   * across platforms.
   */
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: AlertOptions,
  ): void {
    const text = toText(title, message);

    // No buttons, or a single acknowledge button: a plain message. Native
    // still invokes that button's handler on dismissal, so we do too.
    if (!buttons || buttons.length === 0) {
      window.alert(text);
      return;
    }
    if (buttons.length === 1) {
      window.alert(text);
      buttons[0].onPress?.();
      return;
    }

    // Two or more: a choice. Anything past the second button cannot be
    // represented by confirm(), so it collapses into the acting branch —
    // deliberately, since a dropped destructive action is worse than a
    // merged one.
    const { cancel, confirm } = split(buttons);
    if (window.confirm(text)) confirm.onPress?.();
    else cancel.onPress?.();
  },
};
