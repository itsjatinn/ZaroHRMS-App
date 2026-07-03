import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const LOGO_SIZE = 140;

type Props = {
  /** Flip to true once fonts + session are ready; the splash then plays out. */
  isAppReady: boolean;
  /** Called after the exit animation finishes, so the parent can unmount us. */
  onFinish: () => void;
};

/**
 * Full-screen branded splash on the primary navy background. It covers the app
 * while it boots, plays a smooth logo opening, holds, then closes by fading the
 * whole layer out — revealing the app underneath.
 */
export default function AnimatedSplash({ isAppReady, onFinish }: Props) {
  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.82);

  useEffect(() => {
    if (!isAppReady) return;

    // Opening — logo fades and gently scales up.
    logoOpacity.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withSpring(1, { damping: 16, stiffness: 65, mass: 1.1 });

    // Closing — after a short hold, fade the whole layer out.
    const HOLD = 2200;
    logoScale.value = withDelay(
      HOLD,
      withTiming(1.05, { duration: 650, easing: Easing.in(Easing.cubic) }),
    );
    containerOpacity.value = withDelay(
      HOLD,
      withTiming(0, { duration: 650, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [isAppReady]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
      pointerEvents="none"
    >
      <StatusBar style="light" />
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#14323F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
