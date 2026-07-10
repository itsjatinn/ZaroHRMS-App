import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays, Clock3 } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';

export function formatDate(value: Date) {
  return value.toLocaleDateString('en-GB');
}

export function formatTime(value: Date) {
  return value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
      {required ? <Text className="text-red-500"> *</Text> : null}
    </Text>
  );
}

export function DateField({
  value,
  placeholder = 'Select date',
  error = false,
  minimumDate,
  onChange,
}: {
  value: Date | null;
  placeholder?: string;
  error?: boolean;
  minimumDate?: Date;
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
        className={`h-12 flex-row items-center gap-2 rounded-xl border bg-white px-3.5 active:bg-slate-50 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <CalendarDays size={16} color="#94A3B8" />
        <Text className={value ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          mode="date"
          value={value ?? minimumDate ?? new Date()}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}

export function TimeField({
  value,
  placeholder = 'Select time',
  error = false,
  onChange,
}: {
  value: Date | null;
  placeholder?: string;
  error?: boolean;
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
        className={`h-12 flex-row items-center gap-2 rounded-xl border bg-white px-3.5 active:bg-slate-50 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <Clock3 size={16} color="#94A3B8" />
        <Text className={value ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
          {value ? formatTime(value) : placeholder}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          mode="time"
          value={value ?? new Date()}
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}

export function SegmentedPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-2xl bg-slate-200/70 p-1.5">
      {options.map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`h-10 flex-1 items-center justify-center rounded-xl ${
              active ? 'bg-white' : ''
            }`}
            style={active ? cardShadow : undefined}
          >
            <Text
              numberOfLines={1}
              className={`text-sm font-semibold ${
                active ? 'text-ink' : 'text-slate-500'
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
