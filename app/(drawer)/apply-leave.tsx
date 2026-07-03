import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { Calendar, Coffee, Gift, Smile } from 'lucide-react-native';
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
import CalendarPicker from '../../src/components/leave/Calendar';
import LeaveForm from '../../src/components/leave/LeaveForm';
import StatCard from '../../src/components/leave/StatCard';
import {
  LEAVE_TYPES,
  daysBetween,
  isSameDay,
  type Duration,
  type LeaveType,
} from '../../src/components/leave/leaveData';

// Top stats row config (mirrors the leave balances).
const STATS = [
  { label: 'Annual Leave', value: 6, icon: Calendar, color: '#2563EB', badge: 'bg-blue-100' },
  { label: 'Sick Leave', value: 8, icon: Coffee, color: '#059669', badge: 'bg-emerald-100' },
  { label: 'Paternity Leave', value: 7, icon: Smile, color: '#EA7317', badge: 'bg-orange-100' },
  { label: 'Casual Leave', value: 10, icon: Gift, color: '#E11D48', badge: 'bg-rose-100' },
];

export default function LeaveApplicationScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720; // two-column / 4-up layout above this width
  const scrollRef = useRef<ScrollView>(null);
  // Bottom padding equal to the keyboard height gives the form room to scroll
  // the Reason box clear of the keyboard.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Keyboard opens (Reason focused) -> make room + scroll the form up.
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    });
    // Keyboard closes -> remove the room + settle back down at the form.
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Safety net: re-entering the screen resets scroll + padding so it never
  // opens stuck in a scrolled-down state.
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setKeyboardHeight(0);
    }, []),
  );

  // Immediate nudge the moment Reason is focused (before the keyboard event).
  const handleReasonFocus = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
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
  if (fromDate && fromDuration === 'Half Day') daysSelected -= 0.5;
  if (toDate && !isSameDay(fromDate, toDate) && toDuration === 'Half Day') {
    daysSelected -= 0.5;
  }
  daysSelected = Math.max(daysSelected, 0);

  // Calendar selection auto-fills From / To.
  const handleRange = (start: Date | null, end: Date | null) => {
    setFromDate(start);
    setToDate(end);
  };

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

  const clearForm = () => {
    setLeaveType(null);
    setFromDate(null);
    setToDate(null);
    setFromDuration('Full Day');
    setToDuration('Full Day');
    setReason('');
    setAttachment(null);
    setAttempted(false);
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
        {/* 1) Stats row — 4-up on wide screens, 2x2 on narrow */}
        <View className="flex-row flex-wrap gap-3">
          {STATS.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              iconColor={s.color}
              badgeClass={s.badge}
              className={isWide ? 'flex-1' : 'w-[48%]'}
            />
          ))}
        </View>

        {/* 2) Main area — two columns on wide screens, stacked on narrow */}
        <View className={isWide ? 'flex-row gap-4' : 'gap-4'}>
          {/* Left column: calendar + balance */}
          <View className={isWide ? 'flex-1 gap-4' : 'gap-4'}>
            <CalendarPicker
              start={fromDate}
              end={toDate}
              onSelectRange={handleRange}
              onClear={() => handleRange(null, null)}
            />
            <BalanceCard leaveType={leaveType} daysSelected={daysSelected} />
          </View>

          {/* Right column: leave details form */}
          <View className="flex-1">
            <LeaveForm
              leaveType={leaveType}
              onSelectType={handleSelectType}
              fromDate={fromDate}
              toDate={toDate}
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
              onClear={clearForm}
              onApply={applyLeave}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
