import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { cardShadow } from './shadow';
import { EXIT_DURATION, EXIT_EASING } from './morphTiming';
import { ProfileCompletionBody } from './ProfileCompletionCard';

const { height: SCREEN_H } = Dimensions.get('window');

type Props = {
  /** Called once the fly-to-top exit finishes so the parent can unmount us. */
  onClose: () => void;
  /** Called the moment the dismiss begins, so the home card can start landing. */
  onDismissStart?: () => void;
};

/**
 * First-load popup shown when the profile is incomplete: a dimmed backdrop with
 * the completion card centered. On close the card flies up to the top of the
 * screen (where the real card lives on the home page) while the backdrop fades,
 * so it reads as the card settling into place.
 */
export default function ProfileCompletionOverlay({ onClose, onDismissStart }: Props) {
  // 0 = hidden/entering start, 1 = fully shown, then driven back toward exit.
  const enter = useSharedValue(0);
  // Exit driver: 0 = in place, 1 = flown to top + gone.
  const exit = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, []);

  const dismiss = () => {
    // Let the home card begin landing as the overlay card starts flying up, so
    // the two motions cross and read as one continuous move. Both use the shared
    // EXIT_DURATION / EXIT_EASING (see morphTiming) to stay in lockstep.
    onDismissStart?.();
    exit.value = withTiming(
      1,
      { duration: EXIT_DURATION, easing: EXIT_EASING },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: enter.value * (1 - exit.value) * 0.55,
  }));

  const cardStyle = useAnimatedStyle(() => {
    // Entrance: rise + scale up into place. Exit: fly toward the top, fade out.
    const enterTranslate = (1 - enter.value) * 24;
    const enterScale = 0.94 + enter.value * 0.06;
    const exitTranslate = -exit.value * (SCREEN_H * 0.42);
    return {
      opacity: enter.value * (1 - exit.value),
      transform: [
        { translateY: enterTranslate + exitTranslate },
        { scale: enterScale * (1 - exit.value * 0.06) },
      ],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim backdrop — tapping it also dismisses */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Centered card */}
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, cardShadow, cardStyle]}>
          {/* Close button */}
          <Pressable
            onPress={dismiss}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.close}
          >
            <Feather name="x" size={18} color="#5B7B82" />
          </Pressable>

          <ProfileCompletionBody />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#0B1F27',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#CFE0E1',
    backgroundColor: '#EAF1F1',
    padding: 22,
    paddingTop: 26,
  },
  close: {
    position: 'absolute',
    right: 14,
    top: 14,
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.04)',
    zIndex: 10,
  },
});
