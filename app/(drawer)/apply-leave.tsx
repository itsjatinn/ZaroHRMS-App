import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import BalanceCard from '../../src/components/leave/BalanceCard';
import BalanceTile from '../../src/components/leave/BalanceTile';
import LeaveForm from '../../src/components/leave/LeaveForm';
import {
  LEAVE_TYPES,
  daysBetween,
  isSameDay,
  type Duration,
  type LeaveType,
} from '../../src/components/leave/leaveData';

// Top balance tiles (mirrors the leave balances).
const STATS = [
  { label: 'Annual', value: 6, accent: '#2563EB' },
  { label: 'Sick', value: 8, accent: '#059669' },
  { label: 'Paternity', value: 7, accent: '#EA7317' },
  { label: 'Casual', value: 10, accent: '#E11D48' },
];

const REASON_KEYBOARD_OFFSET = 85;

export default function LeaveApplicationScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720; // two-column / 4-up layout above this width
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

  // Days requested, adjusting half-days at either end.
  let daysSelected = daysBetween(fromDate, toDate);
  if (fromDate && toDate && isSameDay(fromDate, toDate)) {
    if (fromDuration === 'Half Day' || toDuration === 'Half Day') {
      daysSelected = 0.5;
    }
  } else {
    if (fromDate && fromDuration === 'Half Day') daysSelected -= 0.5;
    if (toDate && toDuration === 'Half Day') daysSelected -= 0.5;
  }
  daysSelected = Math.max(daysSelected, 0);

  const handleSelectType = (label: string) => {
    const found = LEAVE_TYPES.find((t) => t.short === label) ?? null;
    setLeaveType(found);
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

  const applyLeave = () => {
    setAttempted(true);
    // All starred fields are required.
    if (!leaveType || !fromDate || !toDate || !reason.trim()) return;

    const payload = {
      leaveType: leaveType.key,
      fromDate,
      toDate,
      fromDuration,
      toDuration,
      days: daysSelected,
      reason: reason.trim(),
      attachment: attachment?.name ?? null,
    };
    console.log('Leave application payload:', payload);
    Alert.alert('Leave applied', `${daysSelected} day(s) of ${leaveType.label}.`);
  };

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
          contentContainerClassName="gap-3"
        >
          {STATS.map((s) => (
            <BalanceTile
              key={s.label}
              label={s.label}
              value={s.value}
              accent={s.accent}
            />
          ))}
        </ScrollView>

        {/* 2) Main area — two columns on wide screens, stacked on narrow */}
        <View className={isWide ? 'flex-row gap-4' : 'gap-4'}>
          {/* Left column: balance summary */}
          <View className={isWide ? 'flex-1 gap-4' : 'gap-4'}>
            <BalanceCard leaveType={leaveType} daysSelected={daysSelected} />
          </View>

          {/* Right column: leave details form */}
          <View className="flex-1">
            <LeaveForm
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
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
