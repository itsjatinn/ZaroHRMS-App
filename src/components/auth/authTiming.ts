import { Easing, makeMutable } from 'react-native-reanimated';

/**
 * Shared timing + trigger for the splash → auth "page-turn" handoff.
 *
 * The splash slides its whole layer off to the LEFT while the auth card slides
 * in from the RIGHT. They live on different layers (splash is an overlay on top
 * of the navigator; the auth screen sits underneath) and mount at slightly
 * different times, so a fixed per-component delay drifts out of sync.
 *
 * Instead they share ONE trigger: the splash flips `splashExiting` to 1 the
 * instant it begins sliding out, and the card watches that value to start its
 * own slide. This makes the card slide *because* the splash left — always in
 * lockstep, regardless of mount timing.
 */

// Flips 0 -> 1 exactly when the splash starts its exit slide. Module-level so
// both the splash overlay and the auth card (different trees) share it.
export const splashExiting = makeMutable(0);

// Reset to 0 so a fresh launch (or fast refresh) plays the handoff again.
export function resetSplashHandoff() {
  splashExiting.value = 0;
}

// One curve for the whole cross-slide. easeInOut reads as a smooth page turn
// rather than a snap.
export const SLIDE_DURATION = 550;
export const SLIDE_EASING = Easing.inOut(Easing.cubic);

/**
 * The auth card waits for the splash to be roughly halfway across before its
 * inner elements begin their staggered rise, so the cascade lands just as the
 * screen settles. Measured from when the slide begins.
 */
export const STAGGER_START = SLIDE_DURATION * 0.55;

// Gap between each staggered element and how long each one takes to rise in.
export const STAGGER_STEP = 70;
export const STAGGER_ITEM_DURATION = 420;
