import { useSyncExternalStore } from 'react';

/**
 * Fires the emoji celebration that plays across the whole screen when a pulse
 * reaction is chosen — the app's take on the web GreetingWidget's emoji field.
 *
 * It lives in a module store rather than component state because the overlay has
 * to render outside the home ScrollView (anything inside it would be clipped to
 * the scroll bounds), while the trigger sits on the inline pulse row.
 */

/** Matches the web, which clears the field 2300ms after a tap. */
export const CELEBRATION_MS = 2300;

export type Celebration = {
  emoji: string;
  /** Bumped every trigger so repeat taps of the same emoji replay the burst. */
  key: number;
};

let current: Celebration | null = null;
let nextKey = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getCelebration() {
  return current;
}

/** Plays the burst for `emoji`, replacing any burst already running. */
export function celebrate(emoji: string) {
  nextKey += 1;
  current = { emoji, key: nextKey };
  emit();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    timer = null;
    emit();
  }, CELEBRATION_MS);
}

export function usePulseCelebration() {
  return useSyncExternalStore(subscribe, getCelebration, getCelebration);
}
