import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import BalanceTile, {
  TILE_GAP,
  TILE_WIDTH,
} from '../../src/components/leave/BalanceTile';
import {
  useApplicableLeaveTypes,
  useLeavePolicySettings,
  useMyLeaveRequests,
} from '../../src/api/leave';
import { useHolidayCalendar } from '../../src/api/holidays';
import { useAuth } from '../../src/auth/AuthContext';
import LeaveForm from '../../src/components/leave/LeaveForm';
import {
  LEAVE_TYPES,
  type Duration,
  type LeaveType,
} from '../../src/components/leave/leaveData';
import { evaluateLeaveRequest } from '../../src/components/leave/leavePolicy';

/**
 * Accents for the balance tiles, assigned by position. The same rotation the
 * web's leave widgets use, so a type keeps a consistent colour across products.
 */
const TILE_ACCENTS = [
  '#E07856',
  '#5E9B7B',
  '#D4A24A',
  '#7C7BD8',
  '#2F6D7F',
  '#B96A00',
];

const REASON_KEYBOARD_OFFSET = 85;

export default function LeaveApplicationScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const reasonTargetRef = useRef<number | null>(null);
  // Bottom padding equal to the keyboard height gives the form room to scroll
  // the Reason box clear of the keyboard.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollReasonToKeyboard = useCallback((target = reasonTargetRef.current) => {
    if (!target) return;
    setTimeout(() => {
      scrollRef.current
        ?.getScrollResponder()
        ?.scrollResponderScrollNativeHandleToKeyboard(
          target,
          REASON_KEYBOARD_OFFSET,
          true,
        );
    }, 80);
  }, []);

  useEffect(() => {
    // Keyboard opens (Reason focused) -> make room + place the field above it.
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      scrollReasonToKeyboard();
    });
    // Keyboard closes -> remove the extra room so the form settles back down.
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollReasonToKeyboard]);

  // Safety net: re-entering the screen resets scroll + padding so it never
  // opens stuck in a scrolled-down state.
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setKeyboardHeight(0);
    }, []),
  );

  // Immediate nudge the moment Reason is focused (before the keyboard event).
  const handleReasonFocus = (target: number | null) => {
    reasonTargetRef.current = target;
    scrollReasonToKeyboard(target);
  };


  // ---- Form state ----
  const [leaveType, setLeaveType] = useState<LeaveType | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [fromDuration, setFromDuration] = useState<Duration>('Full Day');
  const [toDuration, setToDuration] = useState<Duration>('Full Day');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<{ name: string } | null>(null);
  const [attempted, setAttempted] = useState(false);

  // Tenant-configured types, filtered to what this employee may apply for. The
  // demo session has no bearer token, so everything below falls back to local
  // defaults rather than firing requests that would 401 and sign the user out.
  const { isBackendSession } = useAuth();
  const applicable = useApplicableLeaveTypes(isBackendSession);
  const leaveTypes = isBackendSession ? applicable.types : LEAVE_TYPES;

  /**
   * Rules for the chosen type. The app's LeaveType carries only display fields,
   * so until the settings payload exposes per-type flags these stay at the
   * permissive defaults: paid, no sandwich rule, no consecutive-day cap.
   */
  const selectedRules = useMemo(
    () =>
      leaveType
        ? { paid: true, sandwichRule: false, maxConsecutiveDays: 0 }
        : null,
    [leaveType],
  );

  const policy = useLeavePolicySettings(isBackendSession);
  const existingRequests = useMyLeaveRequests(isBackendSession);
  const holidays = useHolidayCalendar(new Date().getFullYear(), isBackendSession);

  // Non-optional holidays drop out of the day count when the tenant excludes
  // them; optional ones only count once claimed, so they are not included here.
  const holidayKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const holiday of holidays.data?.holidays ?? []) {
      const iso = holiday.isoDate || holiday.date;
      const optional =
        holiday.isOptional ||
        String(holiday.holidayType || holiday.type || '').toLowerCase() ===
          'optional';
      if (iso && !optional) keys.add(String(iso).slice(0, 10));
    }
    return keys;
  }, [holidays.data]);

  // Chargeable days and every policy check, computed by the shared rules in
  // leavePolicy.ts so this screen only has to render the verdict.
  const evaluation = useMemo(
    () =>
      evaluateLeaveRequest({
        from: fromDate,
        to: toDate,
        fromSession: fromDuration === 'Half Day' ? 'first-half' : 'full',
        toSession: toDuration === 'Half Day' ? 'first-half' : 'full',
        settings: policy,
        type: selectedRules,
        holidayKeys,
        balanceRemaining: leaveType ? leaveType.remaining : null,
        maxConsecutiveDays: selectedRules?.maxConsecutiveDays ?? 0,
        reason,
        hasAttachment: attachment !== null,
        existingRequests: existingRequests.data ?? [],
        today: new Date(),
      }),
    [
      fromDate,
      toDate,
      fromDuration,
      toDuration,
      policy,
      selectedRules,
      holidayKeys,
      leaveType,
      reason,
      attachment,
      existingRequests.data,
    ],
  );

  const daysSelected = evaluation.totalDays ?? 0;

  // Blockers only after a submit attempt, so the form doesn't scold the user
  // for fields they haven't reached yet. Warnings show as soon as they apply.
  const notices = useMemo(
    () => [
      ...(attempted
        ? evaluation.blockers.map((text) => ({ text, blocking: true }))
        : []),
      ...evaluation.warnings.map((text) => ({ text, blocking: false })),
    ],
    [attempted, evaluation.blockers, evaluation.warnings],
  );

  const handleSelectType = (label: string) => {
    setLeaveType(leaveTypes.find((t) => t.short === label) ?? null);
  };

  const pickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const name =
          asset.fileName ?? asset.uri.split('/').pop() ?? 'attachment';
        setAttachment({ name });
      }
    } catch {
      Alert.alert('Could not open the file picker.');
    }
  };

  const submitRequest = () => {
    if (!leaveType) return;
    const payload = {
      leaveType: leaveType.key,
      fromDate,
      toDate,
      fromDuration,
      toDuration,
      days: daysSelected,
      paidDays: evaluation.paidDays,
      lopDays: evaluation.lopDays,
      reason: reason.trim(),
      attachment: attachment?.name ?? null,
    };
    console.log('Leave application payload:', payload);
    Alert.alert('Leave applied', `${daysSelected} day(s) of ${leaveType.label}.`);
  };

  const applyLeave = () => {
    setAttempted(true);
    if (!leaveType || !fromDate || !toDate) return;

    // Policy blockers are hard stops — the first one is the actionable message.
    if (evaluation.blockers.length > 0) {
      Alert.alert('Check your request', evaluation.blockers[0]);
      return;
    }

    // Over-balance days become loss of pay. Make that explicit before the
    // request goes in, rather than letting it surface on a payslip.
    if (evaluation.needsLopAcknowledgement) {
      Alert.alert(
        'Some days are unpaid',
        `${evaluation.lopDays} of ${daysSelected} day(s) exceed your balance and will be treated as loss of pay.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply anyway', onPress: submitRequest },
        ],
      );
      return;
    }

    submitRequest();
  };

  // Built once so the wide and stacked layouts below can order the same two
  // elements differently without duplicating the form's prop list.
  const leaveDetailsForm = (
    <LeaveForm
      types={leaveTypes}
      notices={notices}
      leaveType={leaveType}
      onSelectType={handleSelectType}
      fromDate={fromDate}
      toDate={toDate}
      onFromDate={setFromDate}
      onToDate={setToDate}
      fromDuration={fromDuration}
      toDuration={toDuration}
      onFromDuration={(d) => setFromDuration(d as Duration)}
      onToDuration={(d) => setToDuration(d as Duration)}
      reason={reason}
      onReason={setReason}
      onReasonFocus={handleReasonFocus}
      attachment={attachment}
      onPickFile={pickFile}
      attempted={attempted}
      daysSelected={daysSelected}
      onApply={applyLeave}
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton title="Apply Leave" />
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: keyboardHeight + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1) Balance tiles — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TILE_WIDTH + TILE_GAP}
          decelerationRate="fast"
          contentContainerClassName="gap-3"
        >
          {/* Tapping a tile picks that leave type in the form below — the same
              selector behaviour as the web's balance tiles. */}
          {leaveTypes.map((type, index) => (
            <BalanceTile
              key={type.key}
              label={type.short}
              value={type.remaining}
              accent={TILE_ACCENTS[index % TILE_ACCENTS.length]}
              selected={leaveType?.key === type.key}
              remainingAfter={
                leaveType?.key === type.key ? evaluation.remainingAfter : null
              }
              onPress={() => setLeaveType(type)}
            />
          ))}
        </ScrollView>

        {/* 2) The form. The post-apply balance lives on the selected tile
            above, so there is no separate summary card to place. */}
        <View>{leaveDetailsForm}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
