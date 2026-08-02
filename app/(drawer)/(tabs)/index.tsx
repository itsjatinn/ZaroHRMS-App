import { useEffect, useState } from 'react';
import { View } from 'react-native';
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
import AppScrollView from '../../../src/components/AppScrollView';
import PulseCard from '../../../src/components/PulseCard';
import PulseCelebrationOverlay from '../../../src/components/pulse/PulseCelebrationOverlay';
import ProfileCompletionCard, {
  type ProfileCompletionProps,
} from '../../../src/components/ProfileCompletionCard';
import ProfileCompletionOverlay from '../../../src/components/ProfileCompletionOverlay';
import { EXIT_DURATION, EXIT_EASING, LAND_RISE } from '../../../src/components/morphTiming';
import { useModuleGate } from '../../../src/api/modules';
import { useProfileCompletion } from '../../../src/api/profile';
import { useAuth } from '../../../src/auth/AuthContext';
import ClockInCard from '../../../src/components/ClockInCard';
import LeaveBalanceCard from '../../../src/components/LeaveBalanceCard';
import AttendanceCalendarCard from '../../../src/components/AttendanceCalendarCard';
import PendingApprovalsCard from '../../../src/components/PendingApprovalsCard';
import QuickActionsCard from '../../../src/components/quickActions/QuickActionsCard';

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
  percent,
  missing,
}: {
  hidden: boolean;
  animateIn: boolean;
  onClose: () => void;
} & ProfileCompletionProps) {
  // Not mounted at all while hidden → no reserved space, no gap.
  if (hidden) return null;
  return (
    <LandingCard
      animateIn={animateIn}
      onClose={onClose}
      percent={percent}
      missing={missing}
    />
  );
}

// Rises into place on mount when arriving from the popup, using the SAME timing
// as the overlay's fly-up so the two motions stay synced and read as one card
// moving to the top. Without the popup it shows settled immediately. On close it
// smoothly fades + collapses before the parent unmounts it.
function LandingCard({
  animateIn,
  onClose,
  percent,
  missing,
}: { animateIn: boolean; onClose: () => void } & ProfileCompletionProps) {
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
      <ProfileCompletionCard percent={percent} missing={missing} onClose={close} />
    </Animated.View>
  );
}

export default function Index() {
  const insets = useSafeAreaInsets();
  // Licensed-module gate, as on the web employee home: attendance cards only
  // for attendance orgs, the leave card only for leave orgs. Fails closed
  // while the list loads so a disabled module's card never flashes in; the
  // demo session shows everything.
  const { isBackendSession } = useAuth();
  const gate = useModuleGate(isBackendSession);

  // Live checklist from the backend. Gated on a real session: the demo
  // session carries no bearer token, and an unrecoverable 401 signs the user
  // out — the same reason QuickActionsCard gates its own calls.
  const completionQuery = useProfileCompletion(isBackendSession);
  const completion = completionQuery.data;
  const missing = completion?.items.filter((i) => !i.done) ?? [];
  // Only once the server has answered. Rendering on a pending query would
  // flash the card at 0% for every employee, including finished ones.
  const profileIncomplete = Boolean(completion) && !completion!.complete;

  const [showPopup, setShowPopup] = useState(false);
  // The popup decision has to wait for the query, so it cannot be a useState
  // initialiser. Still fires at most once per launch.
  useEffect(() => {
    if (profileIncomplete && !popupShownThisLaunch) {
      popupShownThisLaunch = true;
      setShowPopup(true);
    }
  }, [profileIncomplete]);
  // Flips true the moment dismiss starts, so the home card lands while the
  // overlay card is still flying up. `showPopup` stays true until the overlay
  // fully exits and unmounts.
  const [dismissing, setDismissing] = useState(false);
  // Whether the user dismissed the home-screen card via its close (X).
  const [cardDismissed, setCardDismissed] = useState(false);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-canvas"
    >
      <AppScrollView className="flex-1">
        {/* gap-5 keeps steady spacing between home sections. The SafeAreaView
            already reserves the status-bar inset, so we only add a small top pad
            here. Bottom padding clears the absolute (floating) tab bar. */}
        <View
          className="gap-5 px-4"
          style={{ paddingTop: 8, paddingBottom: insets.bottom + 112 }}
        >
          <Header />
          <PulseCard />
          {profileIncomplete && !cardDismissed ? (
            <ProfileCardSlot
              hidden={showPopup && !dismissing}
              animateIn={dismissing}
              onClose={() => setCardDismissed(true)}
              percent={completion?.percent ?? 0}
              missing={missing}
            />
          ) : null}
          {gate.attendanceOn ? <ClockInCard /> : null}

          {/* Renders only for managers; hides itself otherwise. */}
          <PendingApprovalsCard />

          {gate.leaveOn ? <LeaveBalanceCard /> : null}

          {gate.attendanceOn || gate.leaveOn ? <AttendanceCalendarCard /> : null}

          <QuickActionsCard />
        </View>
      </AppScrollView>

      {/* Outside the ScrollView so the burst spans the whole screen instead of
          being clipped to the scroll bounds. */}
      <PulseCelebrationOverlay />

      {showPopup && profileIncomplete ? (
        <ProfileCompletionOverlay
          percent={completion?.percent ?? 0}
          missing={missing}
          onDismissStart={() => setDismissing(true)}
          onClose={() => setShowPopup(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
