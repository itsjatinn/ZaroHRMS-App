import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { font } from './auth/fonts';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LOGO_SIZE = 132;

type Props = {
  /** Flip to true once fonts + session are ready; the splash then plays out. */
  isAppReady: boolean;
  /** Called after the exit animation finishes, so the parent can unmount us. */
  onFinish: () => void;
};

/**
 * Full-screen branded splash that covers the app while it boots, then performs
 * a premium entrance + exit. It is rendered on top of the navigator and stays
 * fully opaque white until the native splash hides, so there is never a flash.
 *
 * Timeline once `isAppReady` is true:
 *   logo springs in → wordmark + tagline rise → color glow breathes →
 *   short hold → whole layer fades up and out.
 */
export default function AnimatedSplash({ isAppReady, onFinish }: Props) {
  // Container.
  const containerOpacity = useSharedValue(1);

  // Logo.
  const logoScale = useSharedValue(0.78);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(10);

  // Soft color glow behind the mark.
  const glow = useSharedValue(0); // 0 -> 1 breathing
  const ring = useSharedValue(0); // expanding accent ring

  // Wordmark + tagline.
  const textProgress = useSharedValue(0);

  // Shimmer sweep across the mark.
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!isAppReady) return;

    // Entrance — slow, graceful settle.
    logoOpacity.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) });
    logoTranslateY.value = withSpring(0, { damping: 18, stiffness: 70, mass: 1.1 });
    logoScale.value = withSpring(1, { damping: 16, stiffness: 65, mass: 1.1 });

    // Breathing glow (soft, looping).
    glow.value = withDelay(
      300,
      withRepeat(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );

    // Expanding accent ring pulse.
    ring.value = withDelay(
      400,
      withRepeat(
        withTiming(1, { duration: 2800, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      ),
    );

    // Shimmer sweep.
    shimmer.value = withDelay(
      850,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1400 }), // pause between sweeps
        ),
        -1,
        false,
      ),
    );

    // Wordmark + tagline rise.
    textProgress.value = withDelay(
      650,
      withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }),
    );

    // Exit after the brand has had a beat to land.
    const HOLD = 2700;
    containerOpacity.value = withDelay(
      HOLD,
      withTiming(0, { duration: 750, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
    logoScale.value = withDelay(
      HOLD,
      withTiming(1.06, { duration: 750, easing: Easing.in(Easing.cubic) }),
    );

    return () => {
      cancelAnimation(glow);
      cancelAnimation(ring);
      cancelAnimation(shimmer);
    };
  }, [isAppReady]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoTranslateY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 0.7]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.9, 1.12]) }],
  }));

  const glowAltStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.6, 0.28]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1.1, 0.92]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.15, 1], [0, 0.45, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.7, 1.9]) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shimmer.value,
      [0, 0.1, 0.5, 0.9, 1],
      [0, 0.55, 0.2, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-LOGO_SIZE * 0.9, LOGO_SIZE * 0.9],
          Extrapolation.CLAMP,
        ),
      },
      { rotate: '18deg' },
    ],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: textProgress.value,
    transform: [{ translateY: interpolate(textProgress.value, [0, 1], [14, 0]) }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(textProgress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(textProgress.value, [0, 1], [10, 0]) }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
      pointerEvents="none"
    >
      <StatusBar style="light" />

      {/* Soft brand glows behind the mark */}
      <View style={styles.glowWrap}>
        <Animated.View style={[styles.glowOrb, styles.glowBlue, glowStyle]} />
        <Animated.View style={[styles.glowOrb, styles.glowPink, glowAltStyle]} />
        <Animated.View style={[styles.accentRing, ringStyle]} />
      </View>

      {/* Logo with shimmer sweep */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
      </Animated.View>

      {/* Wordmark */}
      <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
        <Text style={styles.wordmark}>
          <Text style={styles.wordmarkInk}>Zaro</Text>
          <Text style={styles.wordmarkGold}>HR</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>HUMAN RESOURCE MANAGEMENT</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#14323F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    top: SCREEN_H / 2 - 150,
    width: SCREEN_W,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowBlue: {
    backgroundColor: 'rgba(96,165,250,0.30)',
    left: SCREEN_W / 2 - 170,
    top: 10,
  },
  glowPink: {
    backgroundColor: 'rgba(244,114,182,0.24)',
    right: SCREEN_W / 2 - 170,
    top: 30,
  },
  accentRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  shimmer: {
    position: 'absolute',
    top: -LOGO_SIZE * 0.3,
    width: LOGO_SIZE * 0.42,
    height: LOGO_SIZE * 1.6,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  wordmarkWrap: {
    marginTop: 30,
  },
  wordmark: {
    fontSize: 30,
    letterSpacing: 0.5,
  },
  wordmarkInk: {
    color: '#FFFFFF',
    fontFamily: font.bold,
  },
  wordmarkGold: {
    color: '#F1CE6C',
    fontFamily: font.bold,
  },
  tagline: {
    marginTop: 8,
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: font.semibold,
  },
});
