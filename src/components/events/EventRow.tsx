import { Video } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import { KIND_META, timeSummary, type CalendarEvent } from './eventsData';

// One event as a tappable row: a kind-coloured spine, the title, and a
// time/venue line. Shared by the agenda list and the selected-day list so
// both read identically.
export default function EventRow({
  event,
  onPress,
}: {
  event: CalendarEvent;
  onPress: (event: CalendarEvent) => void;
}) {
  const meta = KIND_META[event.kind];

  return (
    <Pressable
      onPress={() => onPress(event)}
      accessibilityRole="button"
      style={cardShadow}
      className="flex-row items-center gap-3 overflow-hidden rounded-[22px] border border-slate-100 bg-white p-4 active:scale-[0.99]"
    >
      <View
        className="h-10 w-1 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>
          {event.title}
        </Text>
        <Text className="mt-0.5 text-[11px] text-slate-400" numberOfLines={1}>
          {timeSummary(event)}
          {event.venue ? ` · ${event.venue}` : ''}
        </Text>
      </View>
      <View
        className="rounded-full px-2 py-1"
        style={{ backgroundColor: meta.bg }}
      >
        <Text className="text-[10px] font-semibold" style={{ color: meta.color }}>
          {meta.label}
        </Text>
      </View>
      {event.meetingUrl ? <Video size={14} color="#94A3B8" /> : null}
    </Pressable>
  );
}
