import * as Linking from 'expo-linking';
import {
  Briefcase,
  CalendarDays,
  CalendarPlus,
  Clock,
  Link as LinkIcon,
  MapPin,
  Users,
  Video,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import {
  formatFullDate,
  KIND_META,
  timeSummary,
  type CalendarEvent,
} from './eventsData';

/** Compact UTC stamp the calendar providers expect: 20260726T093000Z. */
function stamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function detailsBody(event: CalendarEvent) {
  return [event.organizer ? `Organiser: ${event.organizer}` : null, event.meetingUrl]
    .filter(Boolean)
    .join('\n');
}

function googleCalUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(event.start)}/${stamp(event.end ?? event.start)}`,
    details: detailsBody(event),
    location: event.venue ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookCalUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: detailsBody(event),
    location: event.venue ?? '',
    startdt: event.start,
    enddt: event.end ?? event.start,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function DetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
        {icon}
      </View>
      <View className="min-w-0 flex-1">{children}</View>
    </View>
  );
}

export default function EventDetailsSheet({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  const [calOpen, setCalOpen] = useState(false);

  const close = () => {
    setCalOpen(false);
    onClose();
  };

  // Rendered unconditionally so the Modal can animate out; the body is only
  // built when there is an event to show.
  if (!event) return null;
  const meta = KIND_META[event.kind];

  const open = (url: string) => {
    setCalOpen(false);
    Linking.openURL(url).catch(() =>
      Alert.alert("Couldn't open link", 'No app is available to handle it.'),
    );
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={close}>
        <Pressable className="max-h-[88%] rounded-t-[28px] bg-white pb-6">
          <View className="mt-3 h-1 w-10 self-center rounded-full bg-slate-200" />

          <ScrollView
            contentContainerClassName="px-5 pt-4 gap-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-start gap-3">
              <View className="min-w-0 flex-1">
                <View
                  className="self-start rounded-full px-2.5 py-1"
                  style={{ backgroundColor: meta.bg }}
                >
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </Text>
                </View>
                <Text className="mt-2 text-xl font-bold text-ink">
                  {event.title}
                </Text>
              </View>
              <Pressable
                onPress={close}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
              >
                <X size={17} color="#14323F" />
              </Pressable>
            </View>

            <View className="gap-3">
              <DetailRow icon={<CalendarDays size={15} color="#14323F" />}>
                <Text className="text-sm font-semibold text-ink">
                  {formatFullDate(event.start)}
                </Text>
              </DetailRow>
              <DetailRow icon={<Clock size={15} color="#14323F" />}>
                <Text className="text-sm text-slate-600">
                  {timeSummary(event)}
                </Text>
              </DetailRow>
              {event.venue ? (
                <DetailRow icon={<MapPin size={15} color="#14323F" />}>
                  <Text className="text-sm text-slate-600">{event.venue}</Text>
                </DetailRow>
              ) : null}
              {event.organizer ? (
                <DetailRow icon={<Briefcase size={15} color="#14323F" />}>
                  <Text className="text-sm text-slate-600">
                    {event.organizer}
                  </Text>
                </DetailRow>
              ) : null}
              {event.attendees !== undefined ? (
                <DetailRow icon={<Users size={15} color="#14323F" />}>
                  <Text className="text-sm text-slate-600">
                    {event.attendees}{' '}
                    {event.attendees === 1 ? 'attendee' : 'attendees'}
                  </Text>
                </DetailRow>
              ) : null}
              {event.meetingUrl ? (
                <DetailRow icon={<LinkIcon size={15} color="#14323F" />}>
                  <Pressable onPress={() => open(event.meetingUrl!)} hitSlop={6}>
                    <Text className="text-sm font-semibold text-blue-600 underline">
                      Meeting link
                    </Text>
                  </Pressable>
                </DetailRow>
              ) : null}
            </View>

            {event.meta ? (
              <View className="rounded-2xl bg-slate-50 px-4 py-3">
                <Text className="text-xs text-slate-500">{event.meta}</Text>
              </View>
            ) : null}

            <View className="gap-2.5 pt-1">
              {event.meetingUrl ? (
                <Pressable
                  onPress={() => open(event.meetingUrl!)}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#14323F] active:scale-[0.99]"
                >
                  <Video size={16} color="#FFFFFF" />
                  <Text className="text-sm font-bold text-white">Join</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => setCalOpen((v) => !v)}
                className="h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white active:scale-[0.99]"
              >
                <CalendarPlus size={16} color="#14323F" />
                <Text className="text-sm font-bold text-ink">
                  Add to calendar
                </Text>
              </Pressable>

              {calOpen ? (
                <View className="gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <Pressable
                    onPress={() => open(googleCalUrl(event))}
                    className="rounded-xl bg-white px-4 py-3 active:bg-slate-100"
                  >
                    <Text className="text-sm text-ink">Google Calendar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => open(outlookCalUrl(event))}
                    className="rounded-xl bg-white px-4 py-3 active:bg-slate-100"
                  >
                    <Text className="text-sm text-ink">Outlook</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
