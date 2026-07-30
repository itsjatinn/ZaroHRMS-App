import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { DAYS, isHoliday, isWeekend, TODAY, weekdayLetter } from './teamData';

// Shared geometry for both team calendars: a fixed member column on the left
// and a horizontally scrolling day strip on the right.
export const DAY_WIDTH = 34;
export const NAME_WIDTH = 116;
export const GRID_WIDTH = DAYS.length * DAY_WIDTH;

export function dayTint(day: number) {
  if (day === TODAY) return '#EEF5FA';
  if (isHoliday(day)) return '#F4F8FC';
  if (isWeekend(day)) return '#F7F7F9';
  return 'transparent';
}

export function MonthNav({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2">
      <Pressable onPress={onPrev} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100">
        <Feather name="chevron-left" size={18} color="#14323F" />
      </Pressable>
      <Text className="text-sm font-bold text-ink">{label}</Text>
      <Pressable onPress={onNext} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100">
        <Feather name="chevron-right" size={18} color="#14323F" />
      </Pressable>
    </View>
  );
}

// The day-number strip that sits above every grid row.
export function DayHeader() {
  return (
    <View className="h-11 flex-row border-b border-slate-100" style={{ width: GRID_WIDTH }}>
      {DAYS.map((day) => (
        <View
          key={day}
          className="items-center justify-center"
          style={{ width: DAY_WIDTH, backgroundColor: dayTint(day) }}
        >
          <Text className="text-[8px] uppercase text-slate-400">{weekdayLetter(day)}</Text>
          <Text
            className={`text-[11px] font-semibold ${day === TODAY ? 'text-[#2970A8]' : 'text-ink'}`}
          >
            {day}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Weekend / holiday / today background stripes painted behind a grid row.
export function DayStripes({ height }: { height: number }) {
  return (
    <View className="absolute inset-0 flex-row" pointerEvents="none">
      {DAYS.map((day) => (
        <View key={day} style={{ width: DAY_WIDTH, height, backgroundColor: dayTint(day) }} />
      ))}
    </View>
  );
}

export function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <View className="flex-row flex-wrap gap-x-3 gap-y-2 bg-slate-50 px-3 py-3">
      {items.map((item) => (
        <View key={item.label} className="flex-row items-center">
          <View
            className="mr-1.5 h-2.5 w-5 rounded"
            style={{
              backgroundColor: item.color,
              borderWidth: item.dashed ? 1 : 0,
              borderStyle: item.dashed ? 'dashed' : 'solid',
              borderColor: '#B98A0E',
            }}
          />
          <Text className="text-[10px] text-slate-500">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// Fixed left-hand column header, kept in sync with DayHeader's height.
export function MemberColumnHeader({ trailing }: { trailing?: string }) {
  return (
    <View
      className="h-11 justify-center border-b border-r border-slate-100 px-3"
      style={{ width: NAME_WIDTH }}
    >
      <Text className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
        {trailing ?? 'Team member'}
      </Text>
    </View>
  );
}
