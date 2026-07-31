import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  useAttendanceCapture,
  usePunch,
  useTodayAttendance,
} from '../api/attendance';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import PunchOutConfirmModal, {
  type PunchOutProjection,
} from './PunchOutConfirmModal';

const YELLOW = '#F5D14E';
const NAVY = '#14323F';
const GREEN = '#6FCF97';
const RED = '#F08D7E';
const PUNCH_CARD_SHADOW: ViewStyle = {
  shadowColor: NAVY,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

/** "03:12:45" — the live worked-duration counter. */
function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** "1h 20m" / "45m" — for late and early-exit deltas. */
function formatMinutes(value: number): string {
  const minutes = Math.max(0, Math.round(value));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

/** "8.5 hrs" — thresholds in the projection copy. */
function formatHrs(value: number): string {
  return `${Number(value.toFixed(2))} hrs`;
}

/** "09:42 AM" — short time-of-day for punch stamps. */
function formatStamp(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDisplayDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Punch card — the app's counterpart to the web's PunchWidget, with the same
 * three states, the same consequence projection before an early punch out, and
 * the same capture-config gating.
 */
export default function ClockInCard() {
  // Demo session: no bearer token, so the card keeps a local toggle instead of
  // firing requests that would 401 and sign the user out.
  const { isBackendSession } = useAuth();
  const today = useTodayAttendance(isBackendSession);
  const { capture, ready: captureReady } = useAttendanceCapture(isBackendSession);
  const punch = usePunch();
  const [localPunchedIn, setLocalPunchedIn] = useState(false);
  const [now, setNow] = useState(new Date());
  const [locationError, setLocationError] = useState<string | null>(null);
  // Holds the projected consequence while the confirmation is open.
  const [confirming, setConfirming] = useState<PunchOutProjection | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const day = today.data;
  // Three states, as on the web: an out-stamp closes the day, an in-stamp
  // alone means still in, neither means not started. The backend's night-shift
  // continuity keeps "in" true across midnight.
  const isPunchedIn = isBackendSession
    ? Boolean(day?.punchInAt && !day?.punchOutAt)
    : localPunchedIn;
  const isClosedForDay = isBackendSession ? Boolean(day?.punchOutAt) : false;

  const workedMs = useMemo(() => {
    if (!day?.punchInAt) return 0;
    const start = new Date(day.punchInAt).getTime();
    const end = day.punchOutAt ? new Date(day.punchOutAt).getTime() : now.getTime();
    return Math.max(0, end - start);
  }, [day?.punchInAt, day?.punchOutAt, now]);

  /**
   * What today gets marked as if they punch out right now. Mirrors the
   * backend's statusForWorkedHours — punching out is never blocked, this is a
   * heads-up so a short day isn't a surprise on the payslip.
   */
  const projection = useMemo(() => {
    if (!isPunchedIn || !day?.punchInAt) return null;
    const halfDayHrs = Number(day?.shift?.halfDayHrs ?? 0);
    const fullDayHrs = Number(day?.shift?.fullDayHrs ?? 0);
    if (halfDayHrs <= 0 && fullDayHrs <= 0) return null;
    const workedHrs = workedMs / 3_600_000;
    if (halfDayHrs > 0 && workedHrs < halfDayHrs) {
      return {
        tone: 'danger' as const,
        text: `Punching out now will mark today as Absent — at least ${formatHrs(halfDayHrs)} is needed for a half day.`,
      };
    }
    if (fullDayHrs > 0 && workedHrs < fullDayHrs) {
      return {
        tone: 'warn' as const,
        text: `Punching out now will mark today as Half Day — a full day needs ${formatHrs(fullDayHrs)}.`,
      };
    }
    return {
      tone: 'ok' as const,
      text: "Full-day hours completed — you're good to punch out.",
    };
  }, [isPunchedIn, day?.punchInAt, day?.shift, workedMs]);

  const submitPunch = async () => {
    let coords: { latitude: number; longitude: number } | undefined;

    // Location only when the tenant geo-fences. When a live fix is required,
    // block here with a clear message rather than letting the server reject
    // it opaquely.
    if (capture.geoFencing) {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.granted) {
          const position = await Location.getCurrentPositionAsync({});
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        }
      } catch {
        coords = undefined;
      }
      if (!coords && capture.requireLiveLocation) {
        setLocationError(
          'Location is required to punch. Enable location access and try again.',
        );
        return;
      }
    }

    setLocationError(null);
    punch.mutate({
      action: isPunchedIn ? 'PUNCH_OUT' : 'PUNCH_IN',
      ...coords,
    });
  };

  const handlePunch = () => {
    if (!isBackendSession) {
      setLocalPunchedIn((prev) => !prev);
      return;
    }
    if (punch.isPending || today.isPending || isClosedForDay) return;

    // Early punch-out: surface the consequence and make them confirm.
    if (isPunchedIn && projection && projection.tone !== 'ok') {
      setConfirming({ tone: projection.tone, text: projection.text });
      return;
    }
    void submitPunch();
  };

  // The office-network / geo-fence rules are enforced server-side with
  // specific wording — show that, not a generic failure.
  const punchError =
    locationError ??
    (punch.error instanceof ApiError
      ? punch.error.message
      : punch.error
        ? 'Could not reach the server. Try again.'
        : null);

  // Mobile punch turned off for this org — hide the card entirely rather than
  // showing a button that can only refuse. Held back until settings resolve so
  // it can't flash in and vanish.
  if (isBackendSession && (!captureReady || !capture.mobilePunch)) {
    return null;
  }

  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const dateStr = `${weekday} ${now.getDate()} ${month}`.toUpperCase();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const statusLabel = isClosedForDay
    ? 'Punched out for the day'
    : isPunchedIn
      ? 'Currently punched in'
      : 'Not punched in yet';

  const buttonLabel = punch.isPending
      ? 'WORKING…'
      : isClosedForDay
        ? 'DONE'
        : isPunchedIn
        ? 'PUNCH OUT'
        : 'PUNCH IN';

  const inStamp = formatStamp(day?.punchInAt);
  const outStamp = formatStamp(day?.punchOutAt);
  const lateMinutes = Math.max(0, Number(day?.lateMinutes ?? 0));
  const earlyExitMinutes = Math.max(0, Number(day?.earlyExitMinutes ?? 0));

  // Night-shift hints: an open overnight entry belongs to yesterday, and
  // before punching in the shift window carries a "(+1)" next-day marker.
  const overnightOpen = Boolean(day?.overnightOpen);
  const shift = day?.shift;
  const showShiftWindow =
    !overnightOpen &&
    !isPunchedIn &&
    !isClosedForDay &&
    Boolean(shift?.isNightShift && shift?.startTime && shift?.endTime);

  const disabled = punch.isPending || isClosedForDay;

  return (
    <View style={PUNCH_CARD_SHADOW} className="rounded-3xl bg-[#14323F] p-6">
      <View className="flex-row items-center">
        {/* Left: date, status, time */}
        <View className="flex-1 pr-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-white/40">
            {dateStr}
          </Text>

          {/* Status pill */}
          <View className="mt-3 flex-row">
            <View className="flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
              <View
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: isPunchedIn
                    ? YELLOW
                    : isClosedForDay
                      ? GREEN
                      : '#94A3B8',
                }}
              />
              <Text className="text-sm font-semibold text-white">
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Live time */}
          <View className="mt-4 flex-row items-center gap-2">
            <Feather name="clock" size={20} color={YELLOW} />
            <Text className="text-4xl font-bold tracking-tight text-white">
              {time}
            </Text>
          </View>

          {/* Night-shift hints */}
          {overnightOpen && day?.businessDate ? (
            <View className="mt-3 flex-row items-center gap-1.5">
              <Feather name="moon" size={12} color="#94A3B8" />
              <Text className="text-xs text-white/50">
                Night shift — started {formatDisplayDate(day.businessDate)}
              </Text>
            </View>
          ) : null}
          {showShiftWindow && shift ? (
            <View className="mt-3 flex-row items-center gap-1.5">
              <Feather name="moon" size={12} color="#94A3B8" />
              <Text className="text-xs text-white/50">
                {shift.startTime} – {shift.endTime} (+1)
              </Text>
            </View>
          ) : null}

          {/* Today's stamps — each only when its timestamp exists. */}
          {inStamp || outStamp ? (
            <View className="mt-3 gap-1.5">
              {inStamp ? (
                <View className="flex-row flex-wrap items-center gap-2">
                  <Feather name="log-in" size={12} color={GREEN} />
                  <Text className="text-xs text-white/60">
                    Punched in{' '}
                    <Text className="font-bold text-white">{inStamp}</Text>
                  </Text>
                  {lateMinutes > 0 ? (
                    <Text className="text-xs font-semibold" style={{ color: RED }}>
                      Late by {formatMinutes(lateMinutes)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {outStamp ? (
                <View className="flex-row flex-wrap items-center gap-2">
                  <Feather name="log-out" size={12} color="#94A3B8" />
                  <Text className="text-xs text-white/60">
                    Punched out{' '}
                    <Text className="font-bold text-white">{outStamp}</Text>
                  </Text>
                  {earlyExitMinutes > 0 ? (
                    <Text className="text-xs font-semibold" style={{ color: RED }}>
                      Early by {formatMinutes(earlyExitMinutes)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* The server's own words when a punch is refused. */}
          {punchError ? (
            <Text className="mt-3 text-sm font-medium" style={{ color: RED }}>
              {punchError}
            </Text>
          ) : !inStamp && !outStamp ? (
            <Text className="mt-3 text-sm font-medium text-white/50">
              Tap the button to punch in.
            </Text>
          ) : null}
        </View>

        {/* Right: worked counter + dashed ring + punch button */}
        <View className="items-center">
          {inStamp || outStamp ? (
            <View className="mb-2 items-center">
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                {isPunchedIn ? 'Working' : 'Worked today'}
              </Text>
              <Text className="text-sm font-bold text-white">
                {formatDuration(workedMs)}
              </Text>
            </View>
          ) : null}
          <View
            className="items-center justify-center rounded-full p-1"
            style={{
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.25)',
              borderStyle: 'dashed',
            }}
          >
            <Pressable
              onPress={handlePunch}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              accessibilityLabel={isPunchedIn ? 'Punch out' : 'Punch in'}
              className="h-28 w-28 items-center justify-center rounded-full active:scale-95"
              style={{
                backgroundColor: isClosedForDay ? '#94A3B8' : YELLOW,
                opacity: disabled && !isClosedForDay ? 0.7 : 1,
              }}
            >
              {punch.isPending ? (
                <ActivityIndicator color={NAVY} />
              ) : (
                <MaterialCommunityIcons
                  name={isClosedForDay ? 'check' : 'fingerprint'}
                  size={40}
                  color={NAVY}
                />
              )}
              <Text className="mt-1 text-xs font-extrabold tracking-wide text-[#14323F]">
                {buttonLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <PunchOutConfirmModal
        projection={confirming}
        worked={formatDuration(workedMs)}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void submitPunch();
        }}
      />
    </View>
  );
}
