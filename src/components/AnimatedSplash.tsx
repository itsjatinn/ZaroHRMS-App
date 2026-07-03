import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  resetSplashHandoff,
  SLIDE_DURATION,
  SLIDE_EASING,
  splashExiting,
} from './auth/authTiming';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_SIZE = 120;

type Props = {
  /** Flip to true once fonts + session are ready; the splash then plays out. */
  isAppReady: boolean;
  /**
   * When true, exit with the page-turn slide-left (the auth card slides in to
   * meet it). When false (already signed in → home), fade out instead, since
   * there's no sliding screen to hand off to.
   */
  slideExit?: boolean;
  /** Called after the exit animation finishes, so the parent can unmount us. */
  onFinish: () => void;
};

/**
 * Full-screen branded splash that covers the app while it boots, then hands off
 * to the auth flow with a "page-turn": the logo eases in with a soft spring
 * settle, holds for a beat, then the whole layer slides off to the LEFT while
 * the auth card slides in from the RIGHT underneath.
 *
 * The two halves stay in lockstep because both use the shared SLIDE_DURATION /
 * SLIDE_EASING from authTiming — the splash owns the left half of the motion,
 * the auth card owns the right half.
 *
 * It is rendered on top of the navigator and stays fully opaque until the exit
 * so there is never a flash of the app underneath.
 */
export default function AnimatedSplash({ isAppReady, slideExit = true, onFinish }: Props) {
  // Entrance drivers, kept separate so the fade and the settle can use their
  // own curves (a spring for the scale reads far more premium than one linear
  // opacity+scale ramp).
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.82);

  // Exit driver (0 -> 1). Drives either a slide-left (auth) or a fade-out (app).
  const exit = useSharedValue(0);

  useEffect(() => {
    if (!isAppReady) return;

    // Fresh handoff each launch (also covers fast refresh).
    resetSplashHandoff();

    // Entrance: gentle fade paired with a low-stiffness spring that eases up and
    // barely overshoots before settling — calm, weighty, expensive-feeling.
    opacity.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 90,
      mass: 1,
      overshootClamping: false,
    });

    // Hold on the brand, then play the exit.
    const HOLD = 1400;
    const EXIT_START = 650 + HOLD;

    // Only the slide handoff drives the auth card; fire its trigger just as the
    // slide begins. (Skipped on the fade exit — no card to meet.)
    const trigger = slideExit
      ? setTimeout(() => {
          splashExiting.value = 1;
        }, EXIT_START)
      : undefined;

    exit.value = withDelay(
      EXIT_START,
      withTiming(
        1,
        { duration: SLIDE_DURATION, easing: SLIDE_EASING },
        (finished) => {
          if (finished) runOnJS(onFinish)();
        },
      ),
    );

    return () => {
      if (trigger) clearTimeout(trigger);
    };
  }, [isAppReady]);

  const containerStyle = useAnimatedStyle(() =>
    slideExit
      ? { transform: [{ translateX: interpolate(exit.value, [0, 1], [0, -SCREEN_W]) }] }
      : { opacity: 1 - exit.value },
  );

  const logoStyle = useAnimatedStyle(() => ({
    // On the fade exit, let the logo drift up a touch for a premium settle.
    opacity: opacity.value,
    transform: [
      { scale: scale.value * (slideExit ? 1 : 1 + exit.value * 0.06) },
    ],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
      pointerEvents="none"
    >
      <StatusBar style="light" />

      <View style={styles.content}>
        <Animated.View style={logoStyle}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#14323F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
