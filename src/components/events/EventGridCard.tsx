import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  dayNumber,
  KIND_META,
  monthShort,
  timeSummary,
  weekdayLong,
  type CalendarEvent,
} from './eventsData';

type EventGridCardProps = {
  event: CalendarEvent;
  /** Events that have already happened stay in the grid but recede. */
  past?: boolean;
  /** Today's events get the accent border so they read first. */
  today?: boolean;
  onPress?: (event: CalendarEvent) => void;
};

// One tile in the year grid: date chip, kind badge, title, weekday and a
// footer strip with the time (or "Ended" once it has passed).
export default function EventGridCard({
  event,
  past = false,
  today = false,
  onPress,
}: EventGridCardProps) {
  const meta = KIND_META[event.kind];

  return (
    <Pressable
      onPress={onPress ? () => onPress(event) : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${event.title}, ${meta.label}`}
      style={[cardShadow, past && { opacity: 0.55 }]}
      className={`w-[48.5%] rounded-[22px] border bg-white p-3.5 ${
        onPress ? 'active:scale-[0.98] ' : ''
      }${today ? 'border-[#F1CE6C]' : 'border-slate-100'}`}
    >
      {/* Date chip + kind badge */}
      <View className="flex-row items-start justify-between">
        <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
          <Text className="text-[19px] font-bold leading-6 text-ink">
            {dayNumber(event.start)}
          </Text>
          <Text className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            {monthShort(event.start)}
          </Text>
        </View>
        <View
          className="rounded-full px-2 py-1"
          style={{ backgroundColor: meta.bg }}
        >
          <Text
            className="text-[10px] font-semibold"
            style={{ color: meta.color }}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      <Text
        className="mt-3 text-[13.5px] font-bold leading-[18px] text-ink"
        numberOfLines={2}
      >
        {event.title}
      </Text>
      <Text className="mt-0.5 text-[11.5px] text-slate-400">
        {weekdayLong(event.start)}
      </Text>

      <View className="mt-3 border-t border-slate-100 pt-2.5">
        {past ? (
          <Text className="text-[11px] font-medium text-slate-400">Ended</Text>
        ) : today ? (
          <View className="flex-row items-center gap-1 self-start rounded-full bg-[#FCF3D8] px-2 py-1">
            <Check size={11} color="#A16D13" />
            <Text className="text-[10.5px] font-semibold text-[#A16D13]">
              Today · {timeSummary(event)}
            </Text>
          </View>
        ) : (
          <Text className="text-[11px] font-medium text-slate-500">
            {timeSummary(event)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
