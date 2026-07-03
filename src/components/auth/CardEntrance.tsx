import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  interpolate,
  LinearTransition,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  SLIDE_DURATION,
  SLIDE_EASING,
  splashExiting,
  STAGGER_ITEM_DURATION,
  STAGGER_START,
  STAGGER_STEP,
} from './authTiming';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * The splash → auth page-turn should play exactly once per app launch. After it
 * has, later mounts of these components — the keyboard toggling a row, or
 * navigating back to sign-in — must render settled and still. This module-level
 * latch flips as soon as the first entrance is armed.
 */
let entrancePlayed = false;

/**
 * Hands each StaggerItem its ordinal position so the cascade delays itself
 * without the caller tracking indices. A ref counter is fine here: it only
 * increments during render and resets per CardEntrance mount.
 */
const StaggerContext = createContext<{ next: () => number } | null>(null);

type CardEntranceProps = {
  children: ReactNode;
};

/**
 * Slides the auth card in from the RIGHT the instant the splash begins sliding
 * out to the left — they cross like a page turn. Rather than a fixed delay (which
 * drifts because the two layers mount at different times), the card watches the
 * shared `splashExiting` trigger, so its slide starts *because* the splash left.
 *
 * Only the first launch animates; thereafter it renders settled. Wrap the card
 * body once; drop StaggerItem around each row you want to cascade.
 */
export default function CardEntrance({ children }: CardEntranceProps) {
  // Snapshot the latch at mount so this instance's behaviour is stable even
  // after the global flag flips. If the splash already handed off, render
  // settled and skip the trigger entirely.
  const animate = useRef(!entrancePlayed).current;
  const slide = useSharedValue(animate ? 0 : 1); // 0 -> 1: off-right -> settled

  const runSlide = () => {
    'worklet';
    slide.value = withTiming(1, {
      duration: SLIDE_DURATION,
      easing: SLIDE_EASING,
    });
  };

  useEffect(() => {
    if (!animate) return;
    entrancePlayed = true;
    // If the splash already began exiting before this card mounted, the reaction
    // won't see the 0 -> 1 edge — start the slide now so we never get stuck off
    // screen.
    if (splashExiting.value === 1) runSlide();
  }, []);

  // Otherwise start the slide the moment the splash flips its trigger. Runs on
  // the UI thread; fires once on the 0 -> 1 edge.
  useAnimatedReaction(
    () => splashExiting.value,
    (exiting, prev) => {
      if (animate && exiting === 1 && prev !== 1) runSlide();
    },
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(slide.value, [0, 1], [SCREEN_W, 0]) }],
  }));

  // Fresh counter each mount so indices are stable across re-renders of the
  // same screen (the ref persists; we reset it at the top of every render).
  const counter = useRef(0);
  counter.current = 0;
  const ctx = { next: () => counter.current++ };

  return (
    <StaggerContext.Provider value={ctx}>
      <Animated.View style={style}>{children}</Animated.View>
    </StaggerContext.Provider>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  /** Optional explicit index; otherwise auto-assigned in mount order. */
  index?: number;
};

/**
 * Fades + rises its child in, delayed by its position in the cascade, once the
 * card has started sliding in. Renders settled (no animation) after the first
 * entrance has played, and is safe to use outside a CardEntrance.
 */
export function StaggerItem({ children, index }: StaggerItemProps) {
  const ctx = useContext(StaggerContext);
  const order = index ?? ctx?.next() ?? 0;

  // Match CardEntrance: only the launch entrance animates. Snapshot per mount.
  const animate = useRef(!entrancePlayed).current;
  const progress = useSharedValue(animate ? 0 : 1);

  const runRise = () => {
    'worklet';
    // STAGGER_START is measured from when the slide begins (the trigger edge).
    progress.value = withDelay(
      STAGGER_START + order * STAGGER_STEP,
      withTiming(1, {
        duration: STAGGER_ITEM_DURATION,
        easing: Easing.out(Easing.cubic),
      }),
    );
  };

  useEffect(() => {
    // If the splash already handed off before mount, catch up immediately.
    if (animate && splashExiting.value === 1) runRise();
  }, []);

  // Rise in when the splash hands off, staggered by position.
  useAnimatedReaction(
    () => splashExiting.value,
    (exiting, prev) => {
      if (animate && exiting === 1 && prev !== 1) runRise();
    },
  );

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [16, 0]) }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

type RevealProps = {
  /** When true the children mount and slide down into view; false slides out. */
  show: boolean;
  children: ReactNode;
};

/**
 * Conditionally mounts its children with a slide-down + fade-in (and a
 * slide-up + fade-out on removal). Used for the two-step login: the password
 * block reveals below the email once the user continues.
 *
 * Siblings shift smoothly via LinearTransition, so the layout doesn't jump.
 */
export function Reveal({ show, children }: RevealProps) {
  if (!show) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(360).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutUp.duration(220).easing(Easing.in(Easing.cubic))}
      layout={LinearTransition.duration(280)}
    >
      {children}
    </Animated.View>
  );
}
