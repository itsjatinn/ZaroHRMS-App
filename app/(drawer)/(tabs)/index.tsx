import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../../../src/components/Header';
import ProfileCompletionCard, {
  PROFILE_INCOMPLETE,
} from '../../../src/components/ProfileCompletionCard';
import ProfileCompletionOverlay from '../../../src/components/ProfileCompletionOverlay';
import { EXIT_DURATION, EXIT_EASING, LAND_RISE } from '../../../src/components/morphTiming';
import ClockInCard from '../../../src/components/ClockInCard';
import LeaveBalanceCard from '../../../src/components/LeaveBalanceCard';
import AttendanceCalendarCard from '../../../src/components/AttendanceCalendarCard';
import UpcomingHolidaysCard from '../../../src/components/UpcomingHolidaysCard';
import TeamTodayCard from '../../../src/components/TeamTodayCard';
import CelebrationsCard from '../../../src/components/CelebrationsCard';

// Shown once per app launch while the profile is incomplete. This module-level
// latch resets when the app process restarts, so it reappears next open.
let popupShownThisLaunch = false;

/**
 * Holds the home-screen profile card. While the popup is open this renders
 * nothing (so there's no empty gap); once the popup's card flies up, the card
 * mounts and settles in, so it reads as the same card landing into place.
 */
function ProfileCardSlot({
  hidden,
  animateIn,
  onClose,
}: {
  hidden: boolean;
  animateIn: boolean;
  onClose: () => void;
}) {
  // Not mounted at all while hidden → no reserved space, no gap.
  if (hidden) return null;
  return <LandingCard animateIn={animateIn} onClose={onClose} />;
}

// Rises into place on mount when arriving from the popup, using the SAME timing
// as the overlay's fly-up so the two motions stay synced and read as one card
// moving to the top. Without the popup it shows settled immediately. On close it
// smoothly fades + collapses before the parent unmounts it.
function LandingCard({ animateIn, onClose }: { animateIn: boolean; onClose: () => void }) {
  const landed = useSharedValue(animateIn ? 0 : 1);
  const exit = useSharedValue(0); // 0 = present, 1 = closed away

  useEffect(() => {
    if (animateIn) {
      landed.value = withTiming(1, { duration: EXIT_DURATION, easing: EXIT_EASING });
    }
  }, []);

  const close = () => {
    // Fade + shrink + collapse the space, then unmount via the parent.
    exit.value = withTiming(
      1,
      { duration: 300, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  };

  const style = useAnimatedStyle(() => {
    const gone = 1 - exit.value;
    return {
      opacity: landed.value * gone,
      // Collapse the vertical space it takes as it leaves (marginBottom offsets
      // the parent's gap so siblings slide up cleanly).
      maxHeight: interpolate(exit.value, [0, 1], [200, 0]),
      marginBottom: interpolate(exit.value, [0, 1], [0, -20]),
      transform: [
        { translateY: (1 - landed.value) * LAND_RISE - exit.value * 10 },
        { scale: (0.97 + landed.value * 0.03) * (1 - exit.value * 0.04) },
      ],
    };
  });

  return (
    <Animated.View style={style} className="overflow-hidden">
      <ProfileCompletionCard onClose={close} />
    </Animated.View>
  );
}

export default function Index() {
  const insets = useSafeAreaInsets();

  const [showPopup, setShowPopup] = useState(() => {
    if (PROFILE_INCOMPLETE && !popupShownThisLaunch) {
      popupShownThisLaunch = true;
      return true;
    }
    return false;
  });
  // Flips true the moment dismiss starts, so the home card lands while the
  // overlay card is still flying up. `showPopup` stays true until the overlay
  // fully exits and unmounts.
  const [dismissing, setDismissing] = useState(false);
  // Whether the user dismissed the home-screen card via its close (X).
  const [cardDismissed, setCardDismissed] = useState(false);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#F6F7F4' }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* gap-5 keeps steady spacing between home sections. The SafeAreaView
            already reserves the status-bar inset, so we only add a small top pad
            here. Bottom padding clears the absolute (floating) tab bar. */}
        <View
          className="gap-5 px-4"
          style={{ paddingTop: 8, paddingBottom: insets.bottom + 112 }}
        >
          <Header />
          {!cardDismissed ? (
            <ProfileCardSlot
              hidden={showPopup && !dismissing}
              animateIn={dismissing}
              onClose={() => setCardDismissed(true)}
            />
          ) : null}
          <ClockInCard />

          <LeaveBalanceCard />

          <AttendanceCalendarCard />

          <UpcomingHolidaysCard />

          {/* Team today + Celebrations sit side by side */}
          <View className="flex-row gap-4">
            <TeamTodayCard />
            <CelebrationsCard />
          </View>
        </View>
      </ScrollView>

      {showPopup ? (
        <ProfileCompletionOverlay
          onDismissStart={() => setDismissing(true)}
          onClose={() => setShowPopup(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
