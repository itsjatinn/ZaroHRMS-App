import DateTimePicker, {
  type DateTimePickerEvent,
} from '../../src/components/CrossDatePicker';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock3 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import BackButton from '../../src/components/BackButton';
import Dropdown from '../../src/components/leave/Dropdown';
import AttachmentField from '../../src/components/requests/AttachmentField';
import ReasonCounter from '../../src/components/requests/ReasonCounter';
import {
  DEFAULT_REGULARIZE_POLICY,
  evaluateRegularization,
} from '../../src/components/requests/regularizePolicy';
import { REASON_MAX_LENGTH } from '../../src/components/requests/requestReason';
import { cardShadow } from '../../src/components/shadow';

/**
 * The two types the HRMS offers, and only those.
 *
 * "Forgot to check in" was a duplicate of "Missed punch" — identical handling,
 * and the label is display-only, never persisted. "Work outdoor" (On Duty) and
 * "Work from home" are not regularizations at all: they have their own flows
 * with their own allowance limits and approval-time day markers. Submitting
 * them here filed a REGULARIZATION instead, which skipped those limits and
 * marked the day PRESENT rather than ON_DUTY / WFH.
 */
const REQUEST_TYPES = ['Missed punch', 'Wrong in/out'] as const;

const HOURS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);
const MINUTES = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, '0'),
);
const MERIDIEMS = ['AM', 'PM'] as const;
const REASON_KEYBOARD_OFFSET = 85;

function formatDate(value: Date) {
  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
      {required ? <Text className="text-red-500"> *</Text> : null}
    </Text>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={cardShadow}
      className="min-h-[82px] flex-1 justify-center rounded-[22px] border border-slate-100 bg-white px-4 py-3.5"
    >
      <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </Text>
      <Text numberOfLines={2} className="mt-1 text-base font-extrabold text-ink">
        {value}
      </Text>
    </View>
  );
}

function DateInput({
  value,
  error,
  onChange,
}: {
  value: Date | null;
  error: boolean;
  onChange: (value: Date) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === 'dismissed' || !date) return;
    onChange(date);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={`h-14 flex-row items-center rounded-2xl border bg-white px-4 active:bg-slate-50 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <Text className={value ? 'flex-1 text-base text-ink' : 'flex-1 text-base text-slate-400'}>
          {value ? formatDate(value) : 'dd/mm/yyyy'}
        </Text>
        <CalendarDays size={20} color="#64748B" />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}

function TimePart({
  value,
  placeholder,
  options,
  onSelect,
  error,
}: {
  value: string | null;
  placeholder: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  error: boolean;
}) {
  return (
    <Dropdown
      className="flex-1"
      value={value}
      placeholder={placeholder}
      options={options}
      onSelect={onSelect}
      error={error}
    />
  );
}

function TimeGroup({
  label,
  hour,
  minute,
  meridiem,
  onHour,
  onMinute,
  onMeridiem,
  attempted,
}: {
  label: string;
  hour: string | null;
  minute: string | null;
  meridiem: string | null;
  onHour: (value: string) => void;
  onMinute: (value: string) => void;
  onMeridiem: (value: string) => void;
  attempted: boolean;
}) {
  const hasError = attempted && (!hour || !minute || !meridiem);

  return (
    <View className="flex-1">
      <FieldLabel required>{label}</FieldLabel>
      <View className="flex-row items-center gap-2">
        <Clock3 size={18} color="#94A3B8" />
        <TimePart
          value={hour}
          placeholder="HH"
          options={HOURS}
          onSelect={onHour}
          error={hasError && !hour}
        />
        <TimePart
          value={minute}
          placeholder="MM"
          options={MINUTES}
          onSelect={onMinute}
          error={hasError && !minute}
        />
        <TimePart
          value={meridiem}
          placeholder="AM/PM"
          options={MERIDIEMS}
          onSelect={onMeridiem}
          error={hasError && !meridiem}
        />
      </View>
    </View>
  );
}

export default function Regularize() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const scrollRef = useRef<ScrollView>(null);
  const reasonRef = useRef<TextInput>(null);
  const reasonTargetRef = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [requestType, setRequestType] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);

  // Arriving from an absent day on the attendance calendar prefills the date
  // (?date=YYYY-MM-DD).
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  useEffect(() => {
    const raw = Array.isArray(dateParam) ? dateParam[0] : dateParam;
    if (!raw) return;
    const [y, m, d] = raw.split('-').map(Number);
    if (y && m && d) setDate(new Date(y, m - 1, d));
  }, [dateParam]);
  const [inHour, setInHour] = useState<string | null>(null);
  const [inMinute, setInMinute] = useState<string | null>(null);
  const [inMeridiem, setInMeridiem] = useState<string | null>(null);
  const [outHour, setOutHour] = useState<string | null>(null);
  const [outMinute, setOutMinute] = useState<string | null>(null);
  const [outMeridiem, setOutMeridiem] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  /**
   * Tenant attendance rules. The app has no attendance-settings endpoint wired
   * yet, so these are the permissive defaults — swapping in the real payload is
   * a one-line change because evaluateRegularization takes them as an argument.
   */
  const policy = DEFAULT_REGULARIZE_POLICY;

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

  /** 12-hour dropdowns -> "HH:mm", the form the policy rules compare on. */
  const toClock = (
    hour: string | null,
    minute: string | null,
    meridiem: string | null,
  ): string => {
    if (!hour || !minute || !meridiem) return '';
    let h = Number(hour) % 12;
    if (meridiem.toUpperCase().startsWith('P')) h += 12;
    return `${String(h).padStart(2, '0')}:${minute}`;
  };

  const inTime = toClock(inHour, inMinute, inMeridiem);
  const outTime = toClock(outHour, outMinute, outMeridiem);

  // Every HRMS regularization rule, in the web's own order.
  const evaluation = useMemo(
    () =>
      evaluateRegularization({
        settings: policy,
        type: requestType,
        date,
        inTime,
        outTime,
        reason,
        hasAttachment: attachment !== null,
        // Absent/locked/duplicate come from attendance data the app does not
        // load yet, so they stay permissive rather than blocking wrongly. The
        // backend still enforces all three.
        isAbsent: true,
        isLocked: false,
        isDuplicate: false,
        usedThisMonth: 0,
        today: new Date(),
      }),
    [policy, requestType, date, inTime, outTime, reason, attachment],
  );

  const submit = () => {
    setAttempted(true);

    if (evaluation.blockers.length > 0) {
      Alert.alert('Check your request', evaluation.blockers[0]);
      return;
    }

    // The "fill all required fields" blocker already covers these; this narrows
    // them for the compiler and guards against a rule being relaxed later.
    if (!requestType || !date) return;

    const payload = {
      requestType,
      date: formatDate(date),
      checkIn: `${inHour}:${inMinute} ${inMeridiem}`,
      checkOut: `${outHour}:${outMinute} ${outMeridiem}`,
      reason: reason.trim(),
      attachment,
    };

    console.log('Regularize request payload:', payload);
    Alert.alert('Submitted', 'Your regularization request was sent for approval.');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Regularize request"
        subtitle="Provide the correct details for the selected date."
        subtitleNumberOfLines={2}
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-4 px-4"
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: keyboardHeight + insets.bottom + 36,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-3">
          <InfoBox label="This Month" value="3 of 3 left" />
          <InfoBox label="Approval" value="Reporting Manager" />
        </View>

        <View
          style={cardShadow}
          className="rounded-[22px] border border-slate-100 bg-white p-5"
        >
          <View>
            <FieldLabel required>Regularization Type</FieldLabel>
            <Dropdown
              value={requestType}
              placeholder="Select request type"
              options={REQUEST_TYPES}
              onSelect={setRequestType}
              error={attempted && !requestType}
            />
          </View>

          <View className="mt-5">
            <FieldLabel required>Date</FieldLabel>
            <DateInput
              value={date}
              error={attempted && !date}
              onChange={setDate}
            />
          </View>

          {date ? (
            <Text className="mt-4 text-sm font-bold text-blue-600">
              Regularizing attendance for 1 day
            </Text>
          ) : null}

          <View className={isWide ? 'mt-5 flex-row gap-5' : 'mt-5 gap-5'}>
            <TimeGroup
              label="Check-in"
              hour={inHour}
              minute={inMinute}
              meridiem={inMeridiem}
              onHour={setInHour}
              onMinute={setInMinute}
              onMeridiem={setInMeridiem}
              attempted={attempted}
            />
            <TimeGroup
              label="Check-out"
              hour={outHour}
              minute={outMinute}
              meridiem={outMeridiem}
              onHour={setOutHour}
              onMinute={setOutMinute}
              onMeridiem={setOutMeridiem}
              attempted={attempted}
            />
          </View>

          <View className="mt-5">
            <FieldLabel required>Reason</FieldLabel>
            <TextInput
              ref={reasonRef}
              value={reason}
              onChangeText={setReason}
              onFocus={handleReasonFocus}
              placeholder="Share the reason for the regularization."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={REASON_MAX_LENGTH}
              textAlignVertical="top"
              className={`min-h-40 rounded-2xl border bg-white p-4 text-base text-ink ${
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

            <Pressable
              onPress={submit}
              className={isWide
                ? 'h-12 w-72 flex-row items-center justify-center gap-2 rounded-xl bg-ink active:scale-[0.98]'
                : 'h-12 flex-row items-center justify-center gap-2 rounded-xl bg-ink active:scale-[0.98]'}
            >
              <Text className="text-sm font-bold text-white">
                Submit Regularization
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
