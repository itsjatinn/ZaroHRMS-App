import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { Alert } from '../../src/components/CrossAlert';
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
import {
  dayMarkerKey,
  type DayMarkerKind,
} from '../../src/components/calendar/dayMarkers';
import { useAuth } from '../../src/auth/AuthContext';
import AppScrollView from '../../src/components/AppScrollView';
import LeaveForm from '../../src/components/leave/LeaveForm';
import {
  LEAVE_TYPES,
  type Duration,
  type LeaveType,
} from '../../src/components/leave/leaveData';
import {
  dateKey,
  evaluateLeaveRequest,
} from '../../src/components/leave/leavePolicy';
import RequestSuccessModal, {
  type SuccessDetail,
} from '../../src/components/requests/RequestSuccessModal';
import {
  MAX_ATTACHMENT_BYTES,
  requestErrorMessage,
  uploadRequestAttachment,
  useSubmitRequest,
} from '../../src/api/submitRequest';

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

/** "12 Aug 2026" for the confirmation summary. */
function displayDay(value: Date) {
  return value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LeaveApplicationScreen() {
  const router = useRouter();
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

  // Arriving from an absent day on the attendance calendar prefills both ends
  // of the range with that day (?date=YYYY-MM-DD), the same hand-off the
  // Regularize screen accepts.
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  useEffect(() => {
    const raw = Array.isArray(dateParam) ? dateParam[0] : dateParam;
    if (!raw) return;
    const [y, m, d] = raw.split('-').map(Number);
    if (!y || !m || !d) return;
    const picked = new Date(y, m - 1, d);
    setFromDate(picked);
    setToDate(picked);
  }, [dateParam]);
  const [fromDuration, setFromDuration] = useState<Duration>('Full Day');
  const [toDuration, setToDuration] = useState<Duration>('Full Day');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<{
    name: string;
    uri: string;
    mimeType?: string | null;
    /** Set on web only; the upload needs the real File there. */
    file?: File | null;
  } | null>(null);
  const [success, setSuccess] = useState<SuccessDetail[] | null>(null);
  // Covers the whole round trip — the attachment upload runs before the
  // mutation, so the mutation's own isPending would leave a dead gap.
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Tenant-configured types, filtered to what this employee may apply for. The
  // demo session has no bearer token, so everything below falls back to local
  // defaults rather than firing requests that would 401 and sign the user out.
  const { isBackendSession } = useAuth();
  const applicable = useApplicableLeaveTypes(isBackendSession);
  const submitLeave = useSubmitRequest();
  const leaveTypes = isBackendSession ? applicable.types : LEAVE_TYPES;

  /**
   * Rules for the chosen type, as HR configured them. `sandwichRule` stays
   * false because the employee settings payload deliberately omits it — the
   * web can't read it either, and the server applies it authoritatively when
   * it recomputes the day count on submit.
   */
  const selectedRules = useMemo(
    () =>
      leaveType
        ? {
            paid: leaveType.paid !== false,
            sandwichRule: Boolean(leaveType.sandwichRule),
            maxConsecutiveDays: Math.max(
              0,
              Number(leaveType.maxConsecutiveDays ?? 0),
            ),
          }
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

  /**
   * What the date sheet paints on each day. Built from the two feeds this
   * screen already loads, so it costs no extra request: holidays (optional
   * ones kept separate, since they are only days off once claimed) and the
   * employee's own requests.
   *
   * Applying over a holiday, or over a day already requested, is the most
   * common wasted submission — the picker can say so before the form does.
   */
  const dayMarkers = useMemo(() => {
    const map = new Map<string, DayMarkerKind>();

    for (const holiday of holidays.data?.holidays ?? []) {
      const iso = String(holiday.isoDate || holiday.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
      const optional =
        holiday.isOptional ||
        String(holiday.holidayType || holiday.type || '').toLowerCase() ===
          'optional';
      map.set(iso, optional ? 'optional-holiday' : 'holiday');
    }

    // Requests are written after holidays: a day the employee has already
    // booked is the more actionable fact when the two collide.
    for (const request of existingRequests.data ?? []) {
      const status = String(request.status ?? '').toUpperCase();
      // A withdrawal awaiting HR still holds its days, so it reads as
      // approved until that decision lands. Rejected and cancelled requests
      // never reach here — the hook filters them out.
      const kind: DayMarkerKind | null =
        status === 'PENDING'
          ? 'pending-leave'
          : status === 'APPROVED' || status === 'CANCELLATION_REQUESTED'
            ? 'approved-leave'
            : null;
      if (!kind) continue;

      const start = request.startDate ? new Date(request.startDate) : null;
      const end = request.endDate ? new Date(request.endDate) : start;
      if (!start || Number.isNaN(start.getTime())) continue;
      if (!end || Number.isNaN(end.getTime())) continue;

      for (
        const cursor = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
        );
        cursor <= end;
        cursor.setDate(cursor.getDate() + 1)
      ) {
        map.set(
          dayMarkerKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()),
          kind,
        );
      }
    }

    return map;
  }, [holidays.data, existingRequests.data]);

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
        // Images only: the upload endpoint rejects video outright, so offering
        // it meant a long upload that could only end in a server error.
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        let { uri, mimeType } = asset;
        let name = asset.fileName ?? asset.uri.split('/').pop() ?? 'attachment';

        // A full-resolution phone photo is many megabytes and was uploaded
        // as-is, which is what made submissions crawl on mobile data. A proof
        // document stays perfectly readable at 2000px, and re-encoding cuts
        // the upload to a few hundred KB. Native only: on web the picked File
        // is uploaded directly and users pick prepared files there.
        if (Platform.OS !== 'web' && (asset.width ?? 0) > 2000) {
          const resized = await manipulateAsync(
            asset.uri,
            [{ resize: { width: 2000 } }],
            { compress: 0.8, format: SaveFormat.JPEG },
          );
          uri = resized.uri;
          mimeType = 'image/jpeg';
          name = name.replace(/\.[^.]+$/, '') + '.jpg';
        }

        const size =
          Platform.OS === 'web' ? asset.file?.size : asset.fileSize;
        if (uri === asset.uri && (size ?? 0) > MAX_ATTACHMENT_BYTES) {
          Alert.alert(
            'File too large',
            'Attachments can be up to 10 MB. Please choose a smaller file.',
          );
          return;
        }

        setAttachment({ name, uri, mimeType, file: asset.file });
      }
    } catch {
      Alert.alert('Could not open the file picker.');
    }
  };

  const submitRequest = async () => {
    if (!leaveType || !fromDate || !toDate) return;
    if (!isBackendSession) {
      Alert.alert(
        'Sign in to apply',
        'Applying for leave needs a live HRMS session.',
      );
      return;
    }

    setSubmitting(true);
    try {
      // Upload the proof first so the request carries a stored descriptor —
      // the same two-step flow the web uses.
      const stored = attachment
        ? await uploadRequestAttachment(attachment)
        : undefined;

      await submitLeave.mutateAsync({
        category: 'LEAVE',
        type: leaveType.label,
        leaveTypeId: leaveType.key,
        startDate: dateKey(fromDate),
        endDate: dateKey(toDate),
        dayCount: daysSelected,
        fromSession: fromDuration === 'Half Day' ? 'first-half' : 'full',
        toSession: toDuration === 'Half Day' ? 'first-half' : 'full',
        // The LOP dialog stays a client-side confirmation only: the server has
        // no opt-in field for it, and sending one is rejected outright.
        reason: reason.trim(),
        attachment: stored,
      });

      setSuccess([
        { label: 'Leave type', value: leaveType.label },
        {
          label: 'Dates',
          value:
            dateKey(fromDate) === dateKey(toDate)
              ? displayDay(fromDate)
              : `${displayDay(fromDate)} – ${displayDay(toDate)}`,
        },
        { label: 'Days', value: `${daysSelected}` },
        ...(evaluation.lopDays > 0
          ? [{ label: 'Loss of pay', value: `${evaluation.lopDays} day(s)` }]
          : []),
      ]);
    } catch (error) {
      // The server enforces the real policy and returns a specific reason.
      Alert.alert('Could not apply', requestErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const applyLeave = () => {
    if (submitting) return;
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
          { text: 'Apply anyway', onPress: () => void submitRequest() },
        ],
      );
      return;
    }

    void submitRequest();
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
      attachmentRequired={evaluation.attachmentRequired}
      onPickFile={pickFile}
      attempted={attempted}
      daysSelected={daysSelected}
      dayMarkers={dayMarkers}
      weekOffWeekdays={policy.calendar.weekOffDays}
      onApply={applyLeave}
      submitting={submitting}
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton title="Apply Leave" />
      <AppScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: keyboardHeight + 40 }}
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
      </AppScrollView>

      <RequestSuccessModal
        visible={success !== null}
        title="Leave applied"
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
