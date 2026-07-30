import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  byStart,
  KIND_META,
  sameDay,
  WEEKDAYS,
  type CalendarEvent,
} from './eventsData';

// The web panel prints up to three event chips per cell; a phone cell is far
// too narrow for that, so days carry up to three kind-coloured dots and the
// selected day's events are listed in full beneath the grid.
const MAX_DOTS = 3;

type Cell = { date: Date; inMonth: boolean };

/** 6x7 grid covering `month`, padded with the adjacent months' edge days. */
function buildGrid(year: number, month: number): Cell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
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

export default function EventMonthGrid({
  cursor,
  events,
  today,
  selected,
  onSelectDay,
}: {
  cursor: Date;
  events: CalendarEvent[];
  today: Date;
  selected: Date;
  onSelectDay: (date: Date) => void;
}) {
  const grid = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  // Bucket the filtered events by calendar day so each cell is an O(1) lookup.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const d = new Date(e.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key);
      if (list) list.push(e);
      else map.set(key, [e]);
    }
    for (const [key, list] of map) map.set(key, byStart(list));
    return map;
  }, [events]);

  const eventsFor = (d: Date) =>
    eventsByDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];

  return (
    <View
      style={cardShadow}
      className="rounded-[22px] border border-slate-100 bg-white p-4"
    >
      <View className="flex-row">
        {WEEKDAYS.map((w) => (
          <Text
            key={w}
            className="flex-1 text-center text-[11px] font-semibold text-slate-400"
          >
            {w}
          </Text>
        ))}
      </View>

      <View className="mt-2">
        {Array.from({ length: 6 }, (_, row) => (
          <View key={row} className="flex-row">
            {grid.slice(row * 7, row * 7 + 7).map((cell) => {
              const dayEvents = eventsFor(cell.date);
              const isToday = sameDay(cell.date, today);
              const isSelected = sameDay(cell.date, selected);

              return (
                <Pressable
                  key={cell.date.toISOString()}
                  onPress={() => onSelectDay(cell.date)}
                  accessibilityRole="button"
                  accessibilityState={isSelected ? { selected: true } : {}}
                  className="h-12 flex-1 items-center justify-center"
                >
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isSelected
                        ? 'bg-[#14323F]'
                        : isToday
                          ? 'border border-[#F5D14E] bg-[#F5D14E]/15'
                          : ''
                    }`}
                  >
                    <Text
                      className={`text-[13px] ${
                        isSelected
                          ? 'font-bold text-white'
                          : cell.inMonth
                            ? isToday
                              ? 'font-bold text-ink'
                              : 'text-ink'
                            : 'text-slate-300'
                      }`}
                    >
                      {cell.date.getDate()}
                    </Text>
                  </View>

                  {/* Dot rail. Kept at a fixed height so rows never jitter as
                      the filter changes which days have events. */}
                  <View className="mt-0.5 h-1.5 flex-row items-center gap-0.5">
                    {dayEvents.slice(0, MAX_DOTS).map((e) => (
                      <View
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? '#FFFFFF'
                            : KIND_META[e.kind].color,
                          opacity: cell.inMonth ? 1 : 0.4,
                        }}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
