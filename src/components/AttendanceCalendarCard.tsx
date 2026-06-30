import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from './shadow';

const NAVY = '#14323F';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Status = 'present' | 'absent' | 'applied' | 'approved' | 'today';

const STATUS_STYLE: Record<Status, { bg: string; text: string }> = {
  present: { bg: '#CFE6D4', text: '#3F8F5B' },
  absent: { bg: '#F6D8CE', text: '#C0552F' },
  applied: { bg: '#DCD7F4', text: '#6B5FCF' },
  approved: { bg: '#F0E2B6', text: '#B8881F' },
  today: { bg: '#14323F', text: '#FFFFFF' },
};

// Demo statuses for June 2026 (month index 5).
const DEMO_STATUSES: Record<number, Status> = {
  1: 'absent',
  2: 'absent',
  5: 'absent',
  6: 'present',
  12: 'approved',
  19: 'today',
  21: 'applied',
};

const LEGEND: { label: string; color: string }[] = [
  { label: 'Present', color: '#3F8F5B' },
  { label: 'Absent', color: '#C0552F' },
  { label: 'Leave applied', color: '#6B5FCF' },
  { label: 'Leave approved', color: '#B8881F' },
];

export default function AttendanceCalendarCard() {
  // month is 0-indexed; default June 2026.
  const [cursor, setCursor] = useState({ year: 2026, month: 5 });

  const isDemoMonth = cursor.year === 2026 && cursor.month === 5;
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    'en-US',
    { month: 'short', year: 'numeric' },
  );

  // Build cells: leading blanks + days, chunked into weeks of 7.
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const m = c.month + delta;
      return {
        year: c.year + Math.floor(m / 12),
        month: ((m % 12) + 12) % 12,
      };
    });

  return (
    <View style={cardShadow} className="rounded-3xl bg-white p-6">
      {/* Month navigation */}
      <View className="flex-row items-center justify-center gap-4">
        <Pressable
          onPress={() => shiftMonth(-1)}
          className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 active:scale-95"
        >
          <Feather name="chevron-left" size={18} color={NAVY} />
        </Pressable>
        <Text className="text-base font-bold text-ink">{label}</Text>
        <Pressable
          onPress={() => shiftMonth(1)}
          className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 active:scale-95"
        >
          <Feather name="chevron-right" size={18} color={NAVY} />
        </Pressable>
      </View>

      {/* Weekday header */}
      <View className="mt-6 flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text
            key={i}
            className="flex-1 text-center text-xs font-semibold text-slate-400"
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View className="mt-2">
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, di) => {
              const status = day && isDemoMonth ? DEMO_STATUSES[day] : undefined;
              const isWeekend = di === 0 || di === 6;
              return (
                <View key={di} className="h-12 flex-1 items-center justify-center">
                  {day == null ? null : status ? (
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: STATUS_STYLE[status].bg }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: STATUS_STYLE[status].text }}
                      >
                        {day}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      className={`text-sm ${
                        isWeekend ? 'text-slate-300' : 'text-ink'
                      }`}
                    >
                      {day}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View className="mt-6 flex-row flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-5">
        {LEGEND.map((item) => (
          <View key={item.label} className="flex-row items-center gap-1.5">
            <View
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <Text className="text-xs text-slate-500">{item.label}</Text>
          </View>
        ))}
        <View className="flex-row items-center gap-1.5">
          <View
            className="h-3 w-3 rounded-full border"
            style={{ borderColor: '#6B5FCF', borderStyle: 'dashed' }}
          />
          <Text className="text-xs text-slate-500">WFH / Outdoor</Text>
        </View>
      </View>
    </View>
  );
}
