import { CalendarDays, FileText, Paperclip } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

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
  fromDuration: Duration;
  toDuration: Duration;
  onFromDuration: (d: string) => void;
  onToDuration: (d: string) => void;
  reason: string;
  onReason: (text: string) => void;
  onReasonFocus?: () => void;
  attachment: { name: string } | null;
  onPickFile: () => void;
  attempted: boolean; // user pressed Apply at least once
  onClear: () => void;
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

// Read-only date display (the value is driven by the calendar selection).
function DateField({
  value,
  error,
}: {
  value: Date | null;
  error: boolean;
}) {
  return (
    <View
      className={`h-12 flex-1 flex-row items-center gap-2 rounded-xl border bg-white px-3.5 ${
        error ? 'border-red-400' : 'border-slate-200'
      }`}
    >
      <CalendarDays size={16} color="#94A3B8" />
      <Text className={value ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
        {value ? formatDate(value) : 'dd/mm/yyyy'}
      </Text>
    </View>
  );
}

export default function LeaveForm({
  leaveType,
  onSelectType,
  fromDate,
  toDate,
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
  onClear,
  onApply,
}: LeaveFormProps) {
  const typeOptions = LEAVE_TYPES.map((t) => t.short);

  return (
    <View style={cardShadow} className="rounded-2xl bg-white p-5">
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
          <DateField value={fromDate} error={attempted && !fromDate} />
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
          <DateField value={toDate} error={attempted && !toDate} />
          <Dropdown
            className="w-32"
            value={toDuration}
            placeholder="Full Day"
            options={DURATIONS}
            onSelect={onToDuration}
          />
        </View>
      </View>

      {/* Reason */}
      <View className="mt-4">
        <FieldLabel required>Reason</FieldLabel>
        <TextInput
          value={reason}
          onChangeText={onReason}
          onFocus={onReasonFocus}
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
        <View className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pl-2">
          <Pressable
            onPress={onPickFile}
            className="flex-row items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 active:opacity-70"
          >
            <Paperclip size={15} color="#475569" />
            <Text className="text-sm font-semibold text-slate-600">
              Choose file
            </Text>
          </Pressable>
          <Text
            numberOfLines={1}
            className="flex-1 text-sm text-slate-400"
          >
            {attachment ? attachment.name : 'No file chosen'}
          </Text>
        </View>
      </View>

      {/* Footer actions */}
      <View className="mt-6 flex-row gap-3">
        <Pressable
          onPress={onClear}
          className="h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-[0.98]"
        >
          <Text className="text-sm font-semibold text-ink">Clear</Text>
        </Pressable>
        <Pressable
          onPress={onApply}
          className="h-12 flex-[2] items-center justify-center rounded-xl bg-[#14323F] active:scale-[0.98]"
        >
          <Text className="text-sm font-bold text-white">Apply Leave</Text>
        </Pressable>
      </View>
    </View>
  );
}
