import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { usePulseCelebration } from './pulseCelebration';

/**
 * The emoji field from the web GreetingWidget, played across the whole screen.
 *
 * Particle placement, sizes, drifts and delays are the web's fourteen
 * nth-child rules; `rise` is a fraction of screen height instead of a fixed
 * pixel value so the burst crosses the phone rather than a card-sized box.
 */
const PARTICLES: {
  left: number;
  size: number;
  drift: number;
  rise: number;
  delay: number;
}[] = [
  { left: 0.04, size: 18, drift: 18, rise: 0.55, delay: 20 },
  { left: 0.12, size: 28, drift: -12, rise: 0.82, delay: 180 },
  { left: 0.21, size: 21, drift: 24, rise: 0.63, delay: 80 },
  { left: 0.29, size: 32, drift: -20, rise: 0.93, delay: 300 },
  { left: 0.38, size: 19, drift: 14, rise: 0.7, delay: 420 },
  { left: 0.46, size: 26, drift: -26, rise: 0.85, delay: 120 },
  { left: 0.54, size: 18, drift: 20, rise: 0.59, delay: 520 },
  { left: 0.62, size: 34, drift: 12, rise: 0.97, delay: 240 },
  { left: 0.69, size: 22, drift: -16, rise: 0.67, delay: 460 },
  { left: 0.76, size: 29, drift: 24, rise: 0.84, delay: 60 },
  { left: 0.83, size: 18, drift: -22, rise: 0.57, delay: 360 },
  { left: 0.9, size: 32, drift: -14, rise: 0.91, delay: 160 },
  { left: 0.96, size: 22, drift: -28, rise: 0.72, delay: 500 },
  { left: 0.57, size: 20, drift: 30, rise: 0.54, delay: 620 },
];

/** The web's greet-emoji-float duration. */
const FLOAT_MS = 1650;

export default function PulseCelebrationOverlay() {
  const celebration = usePulseCelebration();
  if (!celebration) return null;

  return (
    // pointerEvents none so the burst never swallows a tap meant for the page.
    <View
      className="absolute inset-0"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PARTICLES.map((particle, index) => (
        <Particle
          // Keyed by the celebration so a repeat tap remounts and replays.
          key={`${celebration.key}-${index}`}
          emoji={celebration.emoji}
          particle={particle}
        />
      ))}
    </View>
  );
}

function Particle({
  emoji,
  particle,
}: {
  emoji: string;
  particle: (typeof PARTICLES)[number];
}) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: FLOAT_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [particle.delay, progress]);

  const style = useAnimatedStyle(() => ({
    // Web keyframes: fade in to 0.62, ease down to 0.34, then out.
    opacity: interpolate(progress.value, [0, 0.18, 0.72, 1], [0, 0.62, 0.34, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, particle.drift]) },
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, -particle.rise * height],
        ),
      },
      { scale: interpolate(progress.value, [0, 1], [0.55, 1.08]) },
      {
        rotate: `${interpolate(progress.value, [0, 1], [-10, 12])}deg`,
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          // Starts just below the bottom edge, as the web starts below its card.
          bottom: -40,
          left: particle.left * width,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: particle.size, lineHeight: particle.size * 1.2 }}>
        {emoji}
      </Text>
    </Animated.View>
  );
}
