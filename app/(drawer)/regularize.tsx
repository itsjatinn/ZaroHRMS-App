import DateTimePicker, {
  type DateTimePickerEvent,
} from '../../src/components/CrossDatePicker';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, CalendarDays, Clock3 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';
import { Alert } from '../../src/components/CrossAlert';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  useAttendanceRules,
  useMyMonthDays,
} from '../../src/api/attendance';
import {
  useMyRegularizations,
  useRegularizationEnabled,
} from '../../src/api/leave';
import { useAuth } from '../../src/auth/AuthContext';
import AppScrollView from '../../src/components/AppScrollView';
import BackButton from '../../src/components/BackButton';
import Dropdown from '../../src/components/leave/Dropdown';
import AttachmentField from '../../src/components/requests/AttachmentField';
import ReasonCounter from '../../src/components/requests/ReasonCounter';
import {
  DEFAULT_REGULARIZE_POLICY,
  evaluateRegularization,
  type RegularizePolicySettings,
} from '../../src/components/requests/regularizePolicy';
import {
  requestErrorMessage,
  uploadRequestAttachment,
  useSubmitRequest,
} from '../../src/api/submitRequest';
import { dateKey } from '../../src/components/leave/leavePolicy';
import RequestSuccessModal, {
  type SuccessDetail,
} from '../../src/components/requests/RequestSuccessModal';
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
  maximumDate,
  onChange,
}: {
  value: Date | null;
  error: boolean;
  maximumDate?: Date;
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
          value={value ?? maximumDate ?? new Date()}
          mode="date"
          maximumDate={maximumDate}
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
  // Demo session has no bearer token, so every live read stays disabled and
  // the permissive defaults apply.
  const router = useRouter();
  const { isBackendSession } = useAuth();
  const submitRegularization = useSubmitRequest();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const scrollRef = useRef<ScrollView>(null);
  const reasonRef = useRef<TextInput>(null);
  const reasonTargetRef = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [requestType, setRequestType] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);

  // Today's attendance is only final once the shift ends, so the date picker
  // stops at yesterday.
  const lastRegularizableDate = useMemo(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - 1);
    return day;
  }, []);

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
  const [attachment, setAttachment] = useState<{
    name: string;
    uri: string;
    mimeType?: string | null;
  } | null>(null);
  const [success, setSuccess] = useState<SuccessDetail[] | null>(null);
  // Covers the attachment upload as well as the POST.
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  /**
   * Tenant rules. The master switch lives in the leave settings payload; the
   * reason / attachment / monthly-cap rules live in attendance settings. The
   * demo session has no token, so it keeps the permissive defaults.
   */
  const regularizationEnabled = useRegularizationEnabled(isBackendSession);
  const { rules } = useAttendanceRules(isBackendSession);
  // Memoised: a fresh object each render would re-run the evaluation memo
  // below on every keystroke.
  const policy: RegularizePolicySettings = useMemo(
    () =>
      isBackendSession
        ? {
            enabled: regularizationEnabled,
            requireReason: rules.requireReason,
            requireAttachment: rules.requireRegularizationAttachment,
            attachmentAfterDays: rules.regularizationAttachmentAfterDays,
            maxPerMonth: rules.maxRegularizationsPerMonth,
          }
        : DEFAULT_REGULARIZE_POLICY,
    [
      isBackendSession,
      regularizationEnabled,
      rules.requireReason,
      rules.requireRegularizationAttachment,
      rules.regularizationAttachmentAfterDays,
      rules.maxRegularizationsPerMonth,
    ],
  );

  // The selected day's own state: only an absent day can be regularized, and a
  // locked payroll period freezes it.
  const monthDays = useMyMonthDays(
    (date ?? new Date()).getFullYear(),
    (date ?? new Date()).getMonth() + 1,
    isBackendSession,
  );
  const selectedDay = date
    ? monthDays.data?.find((entry) => entry.day === date.getDate())
    : undefined;
  // Until the month loads, don't assert the day is non-absent — that would
  // block a legitimate request on a slow network. The server re-checks.
  const isAbsent = isBackendSession
    ? monthDays.isPending || !date
      ? true
      : String(selectedDay?.status ?? '').toUpperCase() === 'ABSENT'
    : true;
  const isLocked = isBackendSession ? selectedDay?.locked === true : false;

  // Existing regularizations drive both the duplicate check and the cap.
  const existing = useMyRegularizations(isBackendSession);
  const selectedIso = date ? dateKey(date) : null;
  const isDuplicate = Boolean(
    selectedIso &&
      existing.data?.some((row) => row.date === selectedIso && row.blocking),
  );
  const usedThisMonth = useMemo(() => {
    if (!date) return 0;
    const year = date.getFullYear();
    const month = date.getMonth();
    return (existing.data ?? []).filter((row) => {
      const raised = new Date(row.date);
      return (
        !Number.isNaN(raised.getTime()) &&
        raised.getFullYear() === year &&
        raised.getMonth() === month &&
        row.blocking
      );
    }).length;
  }, [existing.data, date]);

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
        const asset = result.assets[0];
        setAttachment({
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType,
        });
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
        isAbsent,
        isLocked,
        isDuplicate,
        usedThisMonth,
        today: new Date(),
      }),
    [
      policy,
      requestType,
      date,
      inTime,
      outTime,
      reason,
      attachment,
      isAbsent,
      isLocked,
      isDuplicate,
      usedThisMonth,
    ],
  );

  const inlineNotices = useMemo(
    () =>
      evaluation.blockers.filter(
        (blocker) => blocker !== 'Fill all required fields to submit.',
      ),
    [evaluation.blockers],
  );

  const submit = () => {
    if (submitting) return;
    setAttempted(true);

    if (evaluation.blockers.length > 0) {
      Alert.alert('Check your request', evaluation.blockers[0]);
      return;
    }

    // The "fill all required fields" blocker already covers these; this narrows
    // them for the compiler and guards against a rule being relaxed later.
    if (!requestType || !date) return;
    if (!isBackendSession) {
      Alert.alert(
        'Sign in to submit',
        'Regularization needs a live HRMS session.',
      );
      return;
    }

    setSubmitting(true);
    void (async () => {
      try {
        const stored = attachment
          ? await uploadRequestAttachment(attachment)
          : undefined;
        const iso = dateKey(date);
        await submitRegularization.mutateAsync({
          category: 'REGULARIZATION',
          type: requestType,
          startDate: iso,
          endDate: iso,
          // The punch times ride along in the reason, as the web sends them.
          reason: `${reason.trim()} | In: ${inTime} Out: ${outTime}`,
          attachment: stored,
        });
        setSuccess([
          { label: 'Type', value: requestType },
          { label: 'Date', value: formatDate(date) },
          { label: 'Check in', value: inTime },
          { label: 'Check out', value: outTime },
        ]);
      } catch (error) {
        Alert.alert('Could not submit', requestErrorMessage(error));
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Regularize request"
      />

      <AppScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-4 px-4"
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: keyboardHeight + insets.bottom + 36,
        }}
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
              // Today's attendance is only final once the shift ends, so the
              // latest regularizable day is yesterday.
              maximumDate={lastRegularizableDate}
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

          {inlineNotices.length ? (
            <View className="mt-5 gap-2">
              {inlineNotices.map((notice) => (
                <View
                  key={notice}
                  className="flex-row items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5"
                >
                  <AlertCircle size={15} color="#DC2626" />
                  <Text className="flex-1 text-xs font-medium text-red-700">
                    {notice}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className={isWide ? 'mt-6 flex-row items-end gap-5' : 'mt-6 gap-5'}>
            <View className="flex-1">
              <FieldLabel>Attachment</FieldLabel>
              <AttachmentField fileName={attachment?.name ?? null} onPress={pickFile} />
            </View>

            <Pressable
              onPress={submit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting, busy: submitting }}
              style={{ opacity: submitting ? 0.75 : 1 }}
              className={isWide
                ? 'h-12 w-72 flex-row items-center justify-center gap-2 rounded-xl bg-ink active:scale-[0.98]'
                : 'h-12 flex-row items-center justify-center gap-2 rounded-xl bg-ink active:scale-[0.98]'}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
              <Text className="text-sm font-bold text-white">
                {submitting ? 'Submitting…' : 'Submit Regularization'}
              </Text>
            </Pressable>
          </View>
        </View>
      </AppScrollView>

      <RequestSuccessModal
        visible={success !== null}
        title="Regularization submitted"
        message="Your request was sent to your manager for approval."
        details={success ?? []}
        onClose={() => {
          setSuccess(null);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
