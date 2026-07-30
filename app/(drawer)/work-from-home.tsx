import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  findNodeHandle,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useWorkRequestAllowance } from '../../src/api/workRequests';
import { useAuth } from '../../src/auth/AuthContext';
import BackButton from '../../src/components/BackButton';
import BalanceTile from '../../src/components/leave/BalanceTile';
import Dropdown from '../../src/components/leave/Dropdown';
import AttachmentField from '../../src/components/requests/AttachmentField';
import ReasonCounter from '../../src/components/requests/ReasonCounter';
import { REASON_MAX_LENGTH } from '../../src/components/requests/requestReason';
import {
  DateField,
  FieldLabel,
  formatDate,
} from '../../src/components/requests/RequestFields';
import { cardShadow } from '../../src/components/shadow';

// "Work outdoor" is called On duty in the HRMS — same request, current name.
const APPLICATION_TYPES = ['Work from home', 'On duty'] as const;
const DAY_TYPES = ['Full Day', 'First Half', 'Second Half'] as const;
const REASON_KEYBOARD_OFFSET = 85;

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function daysBetween(fromDate: Date | null, toDate: Date | null) {
  if (!fromDate || !toDate) return 0;
  const start = startOfDay(fromDate).getTime();
  const end = startOfDay(toDate).getTime();
  if (end < start) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getSelectedDays({
  fromDate,
  toDate,
  fromDuration,
  toDuration,
}: {
  fromDate: Date | null;
  toDate: Date | null;
  fromDuration: string;
  toDuration: string;
}) {
  const baseDays = daysBetween(fromDate, toDate);
  if (baseDays <= 0) return 0;

  const sameDay =
    fromDate &&
    toDate &&
    startOfDay(fromDate).getTime() === startOfDay(toDate).getTime();

  if (sameDay) {
    return fromDuration !== 'Full Day' || toDuration !== 'Full Day' ? 0.5 : 1;
  }

  let selected = baseDays;
  if (fromDuration !== 'Full Day') selected -= 0.5;
  if (toDuration !== 'Full Day') selected -= 0.5;
  return Math.max(selected, 0);
}

export default function WorkFromHome() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const scrollRef = useRef<ScrollView>(null);
  const reasonRef = useRef<TextInput>(null);
  const reasonTargetRef = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { isBackendSession } = useAuth();
  const [applicationType, setApplicationType] = useState<string | null>('Work from home');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [fromDuration, setFromDuration] = useState('Full Day');
  const [toDuration, setToDuration] = useState('Full Day');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const daysSelected = getSelectedDays({
    fromDate,
    toDate,
    fromDuration,
    toDuration,
  });
  // OD / WFH are the HRMS's own short codes. The previous 'WO' clashed with
  // Weekly Off, and 'WFM' was a typo for WFH.
  const applicationLabel = applicationType === 'On duty' ? 'OD' : 'WFH';

  // WFH and On duty each carry their own HR-set allowance, capped per week or
  // per month. Both are fetched so the tiles can be compared side by side; the
  // date matters because limits resolve against the period it falls in.
  const wfhAllowance = useWorkRequestAllowance('WFH', fromDate, isBackendSession);
  const odAllowance = useWorkRequestAllowance('OD', fromDate, isBackendSession);

  const allowanceTiles = [
    {
      type: 'Work from home' as const,
      label: 'Work from home',
      accent: '#5B5AB8',
      allowance: wfhAllowance.data ?? null,
    },
    {
      type: 'On duty' as const,
      label: 'On duty',
      accent: '#3F7B58',
      allowance: odAllowance.data ?? null,
    },
  ];

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
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      scrollReasonToKeyboard();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollReasonToKeyboard]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setKeyboardHeight(0);
    }, []),
  );

  const handleReasonFocus = () => {
    const target = findNodeHandle(reasonRef.current);
    reasonTargetRef.current = target;
    scrollReasonToKeyboard(target);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAttachment(result.assets[0].name);
      }
    } catch {
      Alert.alert('Could not open the file picker.');
    }
  };

  /** The allowance for the type currently chosen. */
  const selectedAllowance =
    allowanceTiles.find((tile) => tile.type === applicationType)?.allowance ??
    null;

  const submit = () => {
    setAttempted(true);
    if (!applicationType || !fromDate || !toDate || !reason.trim()) return;

    if (startOfDay(toDate) < startOfDay(fromDate)) {
      Alert.alert('Check your dates', 'The end date must be on or after the start date.');
      return;
    }

    // The backend rejects anything over the HR-set cap (e.g. "exceeds the WFH
    // limit of 2/week"), so catch it here with the same numbers rather than
    // letting the employee fill the form in and fail on submit.
    const remaining = selectedAllowance?.remaining;
    if (typeof remaining === 'number' && daysSelected > remaining) {
      const period = selectedAllowance?.period === 'WEEKLY' ? 'week' : 'month';
      Alert.alert(
        'Allowance exceeded',
        remaining === 0
          ? `You have no ${applicationLabel} days left this ${period}.`
          : `You have ${formatDays(remaining)} ${applicationLabel} day(s) left this ${period}, but this request is for ${formatDays(daysSelected)}.`,
      );
      return;
    }

    const payload = {
      applicationType,
      fromDate: formatDate(fromDate),
      fromDuration,
      toDate: formatDate(toDate),
      toDuration,
      days: daysSelected,
      reason: reason.trim(),
      attachment,
    };

    console.log('Application request payload:', payload);
    Alert.alert('Request submitted', 'Your application request was sent for approval.');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Application Details"
        subtitle="Provide the request type, dates, and supporting details."
        subtitleNumberOfLines={2}
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="px-4"
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: keyboardHeight + insets.bottom + 36,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Allowance tiles — tapping one picks that request type, the same way
            the leave balance tiles work. */}
        <View className="mb-4 flex-row gap-3">
          {allowanceTiles.map((tile) => (
            <BalanceTile
              key={tile.type}
              label={`${tile.label}${
                tile.allowance?.period === 'WEEKLY' ? ' / week' : ' / month'
              }`}
              value={tile.allowance?.remaining ?? 0}
              accent={tile.accent}
              selected={applicationType === tile.type}
              onPress={() => setApplicationType(tile.type)}
            />
          ))}
        </View>

        <View
          style={cardShadow}
          className="rounded-[22px] border border-slate-100 bg-white p-5"
        >
          <View>
            <FieldLabel required>Application Type</FieldLabel>
            <Dropdown
              value={applicationType}
              placeholder="Select request type"
              options={APPLICATION_TYPES}
              onSelect={setApplicationType}
              error={attempted && !applicationType}
            />
          </View>

          <View className="mt-5">
            <FieldLabel required>From</FieldLabel>
            <View className="flex-row gap-3">
              <View className="min-w-0 flex-1">
                <DateField
                  value={fromDate}
                  placeholder="dd/mm/yyyy"
                  error={attempted && !fromDate}
                  onChange={(date) => {
                    setFromDate(date);
                    if (toDate && date > toDate) setToDate(date);
                  }}
                />
              </View>
              <Dropdown
                className="w-32"
                value={fromDuration}
                placeholder="Full Day"
                options={DAY_TYPES}
                onSelect={setFromDuration}
              />
            </View>
          </View>

          <View className="mt-5">
            <FieldLabel required>To</FieldLabel>
            <View className="flex-row gap-3">
              <View className="min-w-0 flex-1">
                <DateField
                  value={toDate}
                  placeholder="dd/mm/yyyy"
                  minimumDate={fromDate ?? undefined}
                  error={attempted && !toDate}
                  onChange={setToDate}
                />
              </View>
              <Dropdown
                className="w-32"
                value={toDuration}
                placeholder="Full Day"
                options={DAY_TYPES}
                onSelect={setToDuration}
              />
            </View>
          </View>

          {daysSelected > 0 ? (
            <Text className="mt-5 text-sm font-bold text-blue-600">
              Applying {applicationLabel} for {formatDays(daysSelected)}{' '}
              {daysSelected === 1 ? 'day' : 'days'}
            </Text>
          ) : null}

          <View className="mt-5">
            <FieldLabel required>Reason</FieldLabel>
            <TextInput
              ref={reasonRef}
              value={reason}
              onChangeText={setReason}
              onFocus={handleReasonFocus}
              placeholder="Share the reason for your request."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={REASON_MAX_LENGTH}
              textAlignVertical="top"
              className={`min-h-32 rounded-xl border bg-white p-3.5 text-sm text-ink ${
                attempted && !reason.trim() ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            <ReasonCounter value={reason} />
          </View>

          <View className={isWide ? 'mt-6 flex-row items-end gap-5' : 'mt-6 gap-5'}>
            <View className="flex-1">
              <FieldLabel>Attachment</FieldLabel>
              <AttachmentField fileName={attachment} onPress={pickFile} />
            </View>

            <View className={isWide ? 'w-72' : ''}>
              <Pressable
                onPress={submit}
                className="h-12 items-center justify-center rounded-xl bg-ink px-5 active:scale-[0.98]"
              >
                <Text className="text-sm font-bold text-white">Submit Request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
