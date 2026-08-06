import { CalendarDays, FileText } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import CalendarDateSheet from '../calendar/CalendarDateSheet';
import type { DayMarkerKind } from '../calendar/dayMarkers';
import { focusTargetHandle } from '../nodeHandle';
import AttachmentField from '../requests/AttachmentField';
import ReasonCounter from '../requests/ReasonCounter';
import { REASON_MAX_LENGTH } from '../requests/requestReason';
import { startOfDay } from './leaveData';
import { cardShadow } from '../shadow';
import Dropdown from './Dropdown';
import {
  DURATIONS,
  formatDate,
  type Duration,
  type LeaveType,
} from './leaveData';

type LeaveFormProps = {
  /** Types this employee may apply for — see useApplicableLeaveTypes. */
  types: LeaveType[];
  /** Policy messages to show under the day count. */
  notices?: { text: string; blocking: boolean }[];
  leaveType: LeaveType | null;
  onSelectType: (label: string) => void;
  fromDate: Date | null;
  toDate: Date | null;
  onFromDate: (d: Date) => void;
  onToDate: (d: Date) => void;
  fromDuration: Duration;
  toDuration: Duration;
  onFromDuration: (d: string) => void;
  onToDuration: (d: string) => void;
  reason: string;
  onReason: (text: string) => void;
  onReasonFocus?: (target: number | null) => void;
  attachment: { name: string } | null;
  /** Marks the attachment label with the required asterisk, like the web form. */
  attachmentRequired?: boolean;
  onPickFile: () => void;
  attempted: boolean; // user pressed Apply at least once
  daysSelected: number;
  /** Days the date sheet should call out, keyed `yyyy-mm-dd`. */
  dayMarkers?: Map<string, DayMarkerKind>;
  /** Weekday indexes that are non-working, from the tenant's calendar. */
  weekOffWeekdays?: number[];
  onApply: () => void;
  /** Disables the button and swaps in a spinner while the request is in flight. */
  submitting?: boolean;
};

// Uppercase, letter-spaced field label with a required asterisk.
function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
      {required && <Text className="text-red-500"> *</Text>}
    </Text>
  );
}

// Tappable date field — opens the native date picker.
function DateField({
  value,
  error,
  onPress,
}: {
  value: Date | null;
  error: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-12 flex-1 flex-row items-center gap-2 rounded-xl border bg-white px-3.5 active:bg-slate-50 ${
        error ? 'border-red-400' : 'border-slate-200'
      }`}
    >
      <CalendarDays size={16} color="#94A3B8" />
      <Text className={value ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
        {value ? formatDate(value) : 'dd/mm/yyyy'}
      </Text>
    </Pressable>
  );
}

function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function LeaveForm({
  types,
  notices = [],
  leaveType,
  onSelectType,
  fromDate,
  toDate,
  onFromDate,
  onToDate,
  fromDuration,
  toDuration,
  onFromDuration,
  onToDuration,
  reason,
  onReason,
  onReasonFocus,
  attachment,
  attachmentRequired = false,
  onPickFile,
  attempted,
  daysSelected,
  dayMarkers,
  weekOffWeekdays,
  onApply,
  submitting = false,
}: LeaveFormProps) {
  const typeOptions = types.map((t) => t.short);
  const reasonRef = useRef<TextInput>(null);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);

  /**
   * Neither sheet disables anything, so the start and end calendars look
   * identical — greying out most of the month on the end picker made it read
   * as a different, broken calendar. An out-of-order pick is resolved instead
   * of forbidden: choosing an end before the start re-anchors the range rather
   * than doing nothing when tapped.
   */
  const handlePicked = (date: Date) => {
    const picked = startOfDay(date);
    if (picker === 'from') {
      onFromDate(date);
      // An end date that now precedes the start would be invalid; collapse it
      // onto the new start rather than leaving an impossible range.
      if (toDate && picked > startOfDay(toDate)) onToDate(date);
      return;
    }
    if (picker === 'to') {
      if (fromDate && picked < startOfDay(fromDate)) {
        onFromDate(date);
        onToDate(fromDate);
        return;
      }
      onToDate(date);
    }
  };

  return (
    <View style={cardShadow} className="rounded-[22px] border border-slate-100 bg-white p-5">
      {/* Title */}
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <FileText size={20} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">Leave Details</Text>
          <Text className="text-xs text-slate-400">
            Provide the leave type, dates, and supporting details.
          </Text>
        </View>
      </View>

      {/* Leave Type */}
      <View className="mt-5">
        <FieldLabel required>Leave Type</FieldLabel>
        <Dropdown
          value={leaveType?.short ?? null}
          placeholder="Select leave type"
          options={typeOptions}
          onSelect={onSelectType}
          error={attempted && !leaveType}
        />
      </View>

      {/* From */}
      <View className="mt-4">
        <FieldLabel required>From</FieldLabel>
        <View className="flex-row gap-2">
          <DateField
            value={fromDate}
            error={attempted && !fromDate}
            onPress={() => setPicker('from')}
          />
          <Dropdown
            className="w-32"
            value={fromDuration}
            placeholder="Full Day"
            options={DURATIONS}
            onSelect={onFromDuration}
          />
        </View>
      </View>

      {/* To */}
      <View className="mt-4">
        <FieldLabel required>To</FieldLabel>
        <View className="flex-row gap-2">
          <DateField
            value={toDate}
            error={attempted && !toDate}
            onPress={() => setPicker('to')}
          />
          <Dropdown
            className="w-32"
            value={toDuration}
            placeholder="Full Day"
            options={DURATIONS}
            onSelect={onToDuration}
          />
        </View>
      </View>

      {daysSelected > 0 ? (
        <Text className="mt-4 text-sm font-bold text-blue-600">
          Applying leave for {formatDays(daysSelected)}{' '}
          {daysSelected === 1 ? 'day' : 'days'}
        </Text>
      ) : null}

      {/* Policy notes. Blockers stop submission; warnings are advisory — the
          server has the final say on the day count and limits. */}
      {notices.length > 0 ? (
        <View className="mt-3 gap-1.5">
          {notices.map((notice) => (
            <Text
              key={notice.text}
              className={`text-xs ${
                notice.blocking ? 'text-rose-500' : 'text-amber-700'
              }`}
            >
              • {notice.text}
            </Text>
          ))}
        </View>
      ) : null}

      {/* Reason */}
      <View className="mt-4">
        <FieldLabel required>Reason</FieldLabel>
        <TextInput
          ref={reasonRef}
          value={reason}
          onChangeText={onReason}
          onFocus={() => onReasonFocus?.(focusTargetHandle(reasonRef.current))}
          placeholder="Share the reason for your leave request."
          placeholderTextColor="#94A3B8"
          multiline
          maxLength={REASON_MAX_LENGTH}
          textAlignVertical="top"
          className={`min-h-24 rounded-xl border bg-white p-3.5 text-sm text-ink ${
            attempted && !reason.trim() ? 'border-red-400' : 'border-slate-200'
          }`}
        />
        <ReasonCounter value={reason} />
      </View>

      {/* Attachment */}
      <View className="mt-4">
        <FieldLabel required={attachmentRequired}>Attachment</FieldLabel>
        <AttachmentField
          fileName={attachment?.name ?? null}
          onPress={onPickFile}
        />
      </View>

      {/* Footer actions */}
      <View className="mt-6">
        <Pressable
          onPress={onApply}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-ink active:scale-[0.98] active:bg-ink/90"
          style={{ opacity: submitting ? 0.75 : 1 }}
        >
          {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
          <Text className="text-sm font-bold text-white">
            {submitting ? 'Applying…' : 'Apply Leave'}
          </Text>
        </Pressable>
      </View>

      {/* No minimumDate: handlePicked reorders an out-of-order range, so both
          sheets show a full, identically-styled month. */}
      <CalendarDateSheet
        visible={picker !== null}
        title={picker === 'to' ? 'Select end date' : 'Select start date'}
        value={(picker === 'from' ? fromDate : toDate) ?? fromDate ?? null}
        markers={dayMarkers}
        weekOffWeekdays={weekOffWeekdays}
        onSelect={handlePicked}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}
