import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays, FileText } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import {
  findNodeHandle,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import AttachmentField from '../requests/AttachmentField';
import { cardShadow } from '../shadow';
import Dropdown from './Dropdown';
import {
  DURATIONS,
  LEAVE_TYPES,
  formatDate,
  type Duration,
  type LeaveType,
} from './leaveData';

type LeaveFormProps = {
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
  onPickFile: () => void;
  attempted: boolean; // user pressed Apply at least once
  daysSelected: number;
  onApply: () => void;
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
  onPickFile,
  attempted,
  daysSelected,
  onApply,
}: LeaveFormProps) {
  const typeOptions = LEAVE_TYPES.map((t) => t.short);
  const reasonRef = useRef<TextInput>(null);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);

  const handlePicked = (event: DateTimePickerEvent, date?: Date) => {
    const which = picker;
    setPicker(null);
    if (event.type === 'dismissed' || !date) return;
    if (which === 'from') onFromDate(date);
    else if (which === 'to') onToDate(date);
  };

  return (
    <View style={cardShadow} className="rounded-[24px] border border-slate-100 bg-white p-5">
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

      {/* Reason */}
      <View className="mt-4">
        <FieldLabel required>Reason</FieldLabel>
        <TextInput
          ref={reasonRef}
          value={reason}
          onChangeText={onReason}
          onFocus={() => onReasonFocus?.(findNodeHandle(reasonRef.current))}
          placeholder="Share the reason for your leave request."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          className={`min-h-24 rounded-xl border bg-white p-3.5 text-sm text-ink ${
            attempted && !reason.trim() ? 'border-red-400' : 'border-slate-200'
          }`}
        />
      </View>

      {/* Attachment */}
      <View className="mt-4">
        <FieldLabel>Attachment</FieldLabel>
        <AttachmentField
          fileName={attachment?.name ?? null}
          onPress={onPickFile}
        />
      </View>

      {/* Footer actions */}
      <View className="mt-6">
        <Pressable
          onPress={onApply}
          className="h-12 items-center justify-center rounded-xl bg-ink active:scale-[0.98] active:bg-ink/90"
        >
          <Text className="text-sm font-bold text-white">Apply Leave</Text>
        </Pressable>
      </View>

      {picker && (
        <DateTimePicker
          mode="date"
          value={(picker === 'from' ? fromDate : toDate) ?? fromDate ?? new Date()}
          minimumDate={picker === 'to' ? fromDate ?? undefined : undefined}
          onChange={handlePicked}
        />
      )}
    </View>
  );
}
