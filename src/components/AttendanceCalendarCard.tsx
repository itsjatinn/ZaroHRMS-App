import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

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

type AttendanceCalendarCardProps = {
  variant?: 'card' | 'plain';
  /** When provided, the calendar is controlled by the parent (arrows hidden). */
  year?: number;
  month?: number; // 0-11
};

export default function AttendanceCalendarCard({
  variant = 'card',
  year,
  month,
}: AttendanceCalendarCardProps) {
  const router = useRouter();
  // month is 0-indexed; default June 2026 when uncontrolled.
  const [internal, setInternal] = useState({ year: 2026, month: 5 });
  const controlled = year != null && month != null;
  const cursor = controlled ? { year: year!, month: month! } : internal;
  const setCursor = setInternal;

  // Absent day awaiting action; tapping it again (or any other day) dismisses.
  const [selectedAbsent, setSelectedAbsent] = useState<number | null>(null);
  // Measured width of the day grid, needed to pixel-position the popover.
  const [gridWidth, setGridWidth] = useState(0);

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

  // Any month change (arrows here, or the parent's filter when controlled)
  // invalidates the selection.
  useEffect(() => {
    setSelectedAbsent(null);
  }, [cursor.year, cursor.month]);

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      return {
        year: c.year + Math.floor(m / 12),
        month: ((m % 12) + 12) % 12,
      };
    });
  };

  // Tap an absent day to toggle the callout; tapping any other day dismisses.
  const handleDayPress = (day: number, status: Status | undefined) => {
    if (status === 'absent') {
      setSelectedAbsent((current) => (current === day ? null : day));
    } else {
      setSelectedAbsent(null);
    }
  };

  const goRegularize = () => {
    if (selectedAbsent == null) return;
    const mm = String(cursor.month + 1).padStart(2, '0');
    const dd = String(selectedAbsent).padStart(2, '0');
    setSelectedAbsent(null);
    router.push(`/regularize?date=${cursor.year}-${mm}-${dd}`);
  };

  // Popover geometry: anchored to the selected day's cell, clamped to the
  // grid, flipped above the day when it sits in the last row.
  const ROW_H = 48; // h-12 day rows
  const PILL_W = 118;
  const PILL_H = 34;
  let pillStyle: { top: number; left: number } | null = null;
  if (selectedAbsent != null && gridWidth > 0) {
    const position = firstDay + selectedAbsent - 1;
    const row = Math.floor(position / 7);
    const col = position % 7;
    const cellW = gridWidth / 7;
    const lastRow = row === weeks.length - 1;
    pillStyle = {
      top: lastRow ? row * ROW_H - PILL_H + 4 : (row + 1) * ROW_H - 4,
      left: Math.min(
        Math.max(col * cellW + cellW / 2 - PILL_W / 2, 0),
        gridWidth - PILL_W,
      ),
    };
  }

  return (
    <View
      className={
        variant === 'card'
          ? 'rounded-[24px] border border-slate-100 bg-white px-5 py-5'
          : 'px-1 py-1'
      }
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">Attendance</Text>
        {controlled ? (
          <Text className="text-base font-bold text-ink">{label}</Text>
        ) : (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => shiftMonth(-1)}
              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 active:scale-95"
            >
              <Feather name="chevron-left" size={18} color={NAVY} />
            </Pressable>
            <Text className="text-base font-bold text-ink">{label}</Text>
            <Pressable
              onPress={() => shiftMonth(1)}
              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50 active:scale-95"
            >
              <Feather name="chevron-right" size={18} color={NAVY} />
            </Pressable>
          </View>
        )}
      </View>

      <View className="mt-5 flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text
            key={i}
            className="flex-1 text-center text-xs font-semibold text-slate-400"
          >
            {d}
          </Text>
        ))}
      </View>

      <View
        className="relative mt-2"
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
      >
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, di) => {
              const status = day && isDemoMonth ? DEMO_STATUSES[day] : undefined;
              const isWeekend = di === 0 || di === 6;
              const selected = day != null && day === selectedAbsent;
              return (
                <Pressable
                  key={di}
                  disabled={day == null}
                  onPress={() => day != null && handleDayPress(day, status)}
                  className="h-12 flex-1 items-center justify-center"
                >
                  {day == null ? null : status ? (
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: STATUS_STYLE[status].bg,
                        // Absent days are actionable; the selected one gets an
                        // ink ring while its popover is showing.
                        borderWidth: selected ? 2 : 0,
                        borderColor: NAVY,
                      }}
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
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Regularize popover pill, anchored to the selected absent day */}
        {pillStyle ? (
          <Pressable
            onPress={goRegularize}
            style={{
              position: 'absolute',
              width: PILL_W,
              height: PILL_H,
              zIndex: 10,
              elevation: 6,
              shadowColor: NAVY,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              ...pillStyle,
            }}
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-ink active:scale-95"
          >
            <Feather name="rotate-ccw" size={13} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Regularize</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-5 flex-row flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
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
