import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { isSameDay, startOfDay } from './leaveData';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'];
const NAVY = '#14323F';

type CalendarProps = {
  start: Date | null;
  end: Date | null;
  // Called with (start, end) — end is null while only the first date is picked.
  onSelectRange: (start: Date | null, end: Date | null) => void;
  onClear: () => void;
};

type Cell = { date: Date; inMonth: boolean };

// Build a 6x7 grid of dates covering the given month, padded with the
// leading/trailing days of the adjacent months.
function buildGrid(year: number, month: number): Cell[] {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sun
  const gridStart = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    );
    return { date, inMonth: date.getMonth() === month };
  });
}

export default function Calendar({
  start,
  end,
  onSelectRange,
  onClear,
}: CalendarProps) {
  // Month currently shown; defaults to the start date's month or today.
  const initial = start ?? new Date();
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  const grid = buildGrid(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' },
  );

  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const m = c.month + delta;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });

  // Tap logic: first tap sets start (clears end); second tap sets end,
  // auto-swapping if the user picks an earlier day.
  const handlePress = (date: Date) => {
    const d = startOfDay(date);
    if (!start || (start && end)) {
      onSelectRange(d, null);
    } else if (d < start) {
      onSelectRange(d, start);
    } else {
      onSelectRange(start, d);
    }
  };

  const isEndpoint = (d: Date) => isSameDay(d, start) || isSameDay(d, end);
  const isInMiddle = (d: Date) => {
    if (!start || !end) return false;
    const t = startOfDay(d).getTime();
    return t > startOfDay(start).getTime() && t < startOfDay(end).getTime();
  };

  return (
    <View style={cardShadow} className="rounded-2xl bg-white p-5">
      {/* Title */}
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <CalendarDays size={20} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">Pick Dates</Text>
          <Text className="text-xs text-slate-400">
            Drag across days to select a range
          </Text>
        </View>
      </View>

      {/* Month nav + clear */}
      <View className="mt-5 flex-row items-center justify-between">
        <Pressable
          onPress={() => shiftMonth(-1)}
          className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 active:scale-95"
        >
          <ChevronLeft size={18} color={NAVY} />
        </Pressable>

        <Text className="text-base font-bold text-ink">{monthLabel}</Text>

        <View className="flex-row items-center gap-2">
          <Pressable onPress={onClear} hitSlop={6} className="active:opacity-60">
            <Text className="text-xs font-semibold text-blue-600">
              Clear selection
            </Text>
          </Pressable>
          <Pressable
            onPress={() => shiftMonth(1)}
            className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 active:scale-95"
          >
            <ChevronRight size={18} color={NAVY} />
          </Pressable>
        </View>
      </View>

      {/* Weekday header */}
      <View className="mt-4 flex-row">
        {WEEKDAYS.map((d) => (
          <Text
            key={d}
            className="flex-1 text-center text-xs font-semibold text-slate-400"
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Date grid (6 rows of 7) */}
      <View className="mt-2">
        {Array.from({ length: 6 }, (_, row) => (
          <View key={row} className="flex-row">
            {grid.slice(row * 7, row * 7 + 7).map((cell) => {
              const endpoint = isEndpoint(cell.date);
              const middle = isInMiddle(cell.date);
              return (
                <Pressable
                  key={cell.date.toISOString()}
                  onPress={() => handlePress(cell.date)}
                  className={`h-10 flex-1 items-center justify-center ${
                    middle ? 'bg-blue-100' : ''
                  }`}
                >
                  {endpoint ? (
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-[#14323F]">
                      <Text className="text-sm font-bold text-white">
                        {cell.date.getDate()}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      className={`text-sm ${
                        cell.inMonth ? 'text-ink' : 'text-slate-300'
                      }`}
                    >
                      {cell.date.getDate()}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
