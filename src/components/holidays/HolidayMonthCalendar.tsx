import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  accentColor,
  isWeekOff,
  MONTHS,
  WEEK_OFF_COLOR,
  WEEKDAY_SHORT,
  type CalendarHoliday,
} from './holidayCalendarData';

type HolidayMonthCalendarProps = {
  monthIndex: number;
  year: number;
  today: Date;
  /** Day of month → holiday, for the month on screen. */
  holidaysByDay: Map<number, CalendarHoliday>;
  selectedDay: number | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number | null) => void;
};

/** Weeks of seven cells; null pads the lead-in and the tail. */
function buildWeeks(year: number, monthIndex: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return Array.from({ length: cells.length / 7 }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7),
  );
}

// The month card from the web calendar: chevron month nav, weekday header and
// bordered day cells that carry a tint for holidays and week-offs. A phone cell
// is too narrow for the web's full-name pill, so the name is clipped here and
// the tapped day expands into a panel under the card.
export default function HolidayMonthCalendar({
  monthIndex,
  year,
  today,
  holidaysByDay,
  selectedDay,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: HolidayMonthCalendarProps) {
  const weeks = useMemo(
    () => buildWeeks(year, monthIndex),
    [year, monthIndex],
  );

  const todayDay =
    today.getFullYear() === year && today.getMonth() === monthIndex
      ? today.getDate()
      : null;

  return (
    <View
      style={cardShadow}
      className="rounded-2xl border border-[#14323F]/10 bg-white p-3"
    >
      {/* Month nav */}
      <View className="flex-row items-center justify-center gap-4">
        <Pressable
          onPress={onPrevMonth}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100"
        >
          <ChevronLeft size={17} color="#3A80E9" />
        </Pressable>
        <Text className="text-[15px] font-semibold text-ink">
          {MONTHS[monthIndex]} {year}
        </Text>
        <Pressable
          onPress={onNextMonth}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100"
        >
          <ChevronRight size={17} color="#3A80E9" />
        </Pressable>
      </View>

      {/* Weekday header */}
      <View className="mt-2.5 flex-row">
        {WEEKDAY_SHORT.map((weekday) => (
          <Text
            key={weekday}
            className="flex-1 text-center text-[10px] uppercase tracking-wider text-[#14323F]/45"
          >
            {weekday}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View className="mt-2 gap-1.5">
        {weeks.map((week, row) => (
          <View key={row} className="flex-row gap-1">
            {week.map((day, column) => {
              if (!day) {
                return <View key={`pad-${row}-${column}`} className="flex-1" />;
              }

              const holiday = holidaysByDay.get(day);
              const weekOff = !holiday && isWeekOff(new Date(year, monthIndex, day));
              const accent = holiday ? accentColor(holiday) : WEEK_OFF_COLOR;
              const tinted = !!holiday || weekOff;
              const isToday = todayDay === day;
              const isSelected = selectedDay === day;

              return (
                <Pressable
                  key={day}
                  onPress={() => onSelectDay(isSelected || !holiday ? null : day)}
                  disabled={!holiday}
                  accessibilityRole={holiday ? 'button' : undefined}
                  accessibilityLabel={`${day} ${MONTHS[monthIndex]}${
                    holiday ? `, ${holiday.name}` : weekOff ? ', week off' : ''
                  }`}
                  style={{
                    minHeight: 54,
                    backgroundColor: tinted ? `${accent}14` : '#FFFFFF',
                    borderColor: isSelected
                      ? '#3A80E9'
                      : isToday
                        ? '#F1CE6C'
                        : tinted
                          ? `${accent}55`
                          : 'rgba(20,50,63,0.08)',
                    borderWidth: isToday || isSelected ? 2 : 1,
                  }}
                  className="flex-1 rounded-xl px-1 pb-1 pt-1.5 active:opacity-80"
                >
                  <Text
                    className={`text-[11.5px] ${
                      isToday ? 'font-extrabold' : 'font-semibold'
                    } text-ink`}
                  >
                    {day}
                  </Text>
                  {holiday ? (
                    <Text
                      numberOfLines={2}
                      className="mt-0.5 text-[7.5px] font-semibold leading-[9px]"
                      style={{ color: accent }}
                    >
                      {holiday.name}
                    </Text>
                  ) : weekOff ? (
                    <Text className="mt-0.5 text-[7.5px] font-semibold leading-[9px] text-[#14323F]/55">
                      Week Off
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
