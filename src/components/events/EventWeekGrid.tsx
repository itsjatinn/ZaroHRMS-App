import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  formatTime,
  HOURS,
  KIND_META,
  sameDay,
  startOfWeek,
  WEEKDAYS,
  type CalendarEvent,
} from './eventsData';

// Seven columns will not fit legibly on a phone, so the day columns scroll
// horizontally behind a pinned hour gutter — the same shape the team
// calendars already use. Row heights are fixed constants precisely so the
// gutter and the scrolling block stay locked together.
const GUTTER_WIDTH = 52;
const DAY_WIDTH = 116;
const HEAD_HEIGHT = 48;
const ALLDAY_HEIGHT = 58;
const HOUR_HEIGHT = 56;

/** Up to two all-day chips fit in the fixed-height strip; the rest collapse. */
const MAX_ALLDAY_CHIPS = 2;

function hourLabel(h: number) {
  const display = h <= 12 ? h : h - 12;
  return `${display} ${h < 12 ? 'AM' : 'PM'}`;
}

export default function EventWeekGrid({
  cursor,
  events,
  today,
  onSelect,
}: {
  cursor: Date;
  events: CalendarEvent[];
  today: Date;
  onSelect: (event: CalendarEvent) => void;
}) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [cursor]);

  const eventsByDayIndex = useMemo(() => {
    const buckets: CalendarEvent[][] = Array.from({ length: 7 }, () => []);
    for (const e of events) {
      const d = new Date(e.start);
      const index = days.findIndex((day) => sameDay(d, day));
      if (index >= 0) buckets[index].push(e);
    }
    return buckets;
  }, [events, days]);

  return (
    <View
      style={cardShadow}
      className="overflow-hidden rounded-[22px] border border-slate-100 bg-white"
    >
      <View className="flex-row">
        {/* Pinned gutter — heights mirror the scrolling block row for row. */}
        <View style={{ width: GUTTER_WIDTH }} className="border-r border-slate-100">
          <View style={{ height: HEAD_HEIGHT }} className="border-b border-slate-100" />
          <View
            style={{ height: ALLDAY_HEIGHT }}
            className="items-center justify-center border-b border-slate-100 bg-slate-50"
          >
            <Text className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              All day
            </Text>
          </View>
          {HOURS.map((h) => (
            <View
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className="items-center border-b border-slate-50 pt-1"
            >
              <Text className="text-[10px] text-slate-400">{hourLabel(h)}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: DAY_WIDTH * 7 }}>
            {/* Day heads */}
            <View
              style={{ height: HEAD_HEIGHT }}
              className="flex-row border-b border-slate-100"
            >
              {days.map((d) => {
                const isToday = sameDay(d, today);
                return (
                  <View
                    key={d.toISOString()}
                    style={{ width: DAY_WIDTH }}
                    className={`items-center justify-center ${
                      isToday ? 'bg-[#F5D14E]/15' : ''
                    }`}
                  >
                    <Text className="text-[9px] uppercase tracking-wide text-slate-400">
                      {WEEKDAYS[d.getDay()]}
                    </Text>
                    <Text
                      className={`text-[13px] font-bold ${
                        isToday ? 'text-[#B8881F]' : 'text-ink'
                      }`}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* All-day strip */}
            <View
              style={{ height: ALLDAY_HEIGHT }}
              className="flex-row border-b border-slate-100 bg-slate-50"
            >
              {eventsByDayIndex.map((dayEvents, i) => {
                const allDay = dayEvents.filter((e) => e.allDay);
                const shown = allDay.slice(0, MAX_ALLDAY_CHIPS);
                const more = allDay.length - shown.length;
                return (
                  <View
                    key={days[i].toISOString()}
                    style={{ width: DAY_WIDTH }}
                    className="gap-1 border-r border-slate-100 p-1"
                  >
                    {shown.map((e) => (
                      <Pressable
                        key={e.id}
                        onPress={() => onSelect(e)}
                        className="rounded-md px-1.5 py-1 active:opacity-70"
                        style={{ backgroundColor: KIND_META[e.kind].bg }}
                      >
                        <Text
                          numberOfLines={1}
                          className="text-[10px] font-semibold"
                          style={{ color: KIND_META[e.kind].color }}
                        >
                          {e.title}
                        </Text>
                      </Pressable>
                    ))}
                    {more > 0 ? (
                      <Text className="px-1.5 text-[9px] text-slate-400">
                        +{more} more
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* Hour rows */}
            {HOURS.map((h) => (
              <View
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="flex-row border-b border-slate-50"
              >
                {eventsByDayIndex.map((dayEvents, i) => {
                  const slot = dayEvents.filter(
                    (e) => !e.allDay && new Date(e.start).getHours() === h,
                  );
                  const isToday = sameDay(days[i], today);
                  return (
                    <View
                      key={days[i].toISOString()}
                      style={{ width: DAY_WIDTH }}
                      className={`gap-1 border-r border-slate-100 p-1 ${
                        isToday ? 'bg-[#F5D14E]/[0.06]' : ''
                      }`}
                    >
                      {slot.map((e) => (
                        <Pressable
                          key={e.id}
                          onPress={() => onSelect(e)}
                          className="flex-1 justify-center rounded-md border-l-2 px-1.5 py-1 active:opacity-70"
                          style={{
                            backgroundColor: KIND_META[e.kind].bg,
                            borderLeftColor: KIND_META[e.kind].color,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            className="text-[10px] font-bold"
                            style={{ color: KIND_META[e.kind].color }}
                          >
                            {e.title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            className="text-[9px]"
                            style={{ color: KIND_META[e.kind].color }}
                          >
                            {formatTime(e.start)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
