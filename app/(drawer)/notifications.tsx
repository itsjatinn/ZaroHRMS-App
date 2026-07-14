import { BellOff } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import NotificationCard from '../../src/components/notifications/NotificationCard';
import {
  markAllRead,
  useNotifications,
  type AppNotification,
  type NotificationDay,
} from '../../src/components/notifications/notificationsStore';

export default function NotificationsScreen() {
  const notifications = useNotifications();

  // Snapshot which items were unread on arrival: the store is marked read
  // immediately (clearing the bell dot), but the cards keep their fresh-dot
  // highlight for the duration of this visit.
  const [arrivedUnread] = useState(
    () => new Set(notifications.filter((n) => n.unread).map((n) => n.id)),
  );

  useEffect(() => {
    markAllRead();
  }, []);

  // Consecutive items sharing a day collapse under one section header
  // (the feed is ordered newest-first).
  const grouped = useMemo(() => {
    const sections: { day: NotificationDay; items: AppNotification[] }[] = [];
    for (const n of notifications) {
      const last = sections[sections.length - 1];
      if (last && last.day === n.day) last.items.push(n);
      else sections.push({ day: n.day, items: [n] });
    }
    return sections;
  }, [notifications]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Notifications"
        subtitle={
          arrivedUnread.size > 0
            ? `${arrivedUnread.size} new since your last visit`
            : 'You’re all caught up'
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-32 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {grouped.length > 0 ? (
          grouped.map((section, i) => (
            <View key={section.day} className={i === 0 ? '' : 'mt-5'}>
              <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.day}
              </Text>
              <View className="gap-3">
                {section.items.map((n) => (
                  <NotificationCard
                    key={n.id}
                    item={n}
                    highlight={arrivedUnread.has(n.id)}
                  />
                ))}
              </View>
            </View>
          ))
        ) : (
          <View className="mt-24 items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <BellOff size={26} color="#94A3B8" />
            </View>
            <Text className="text-base font-bold text-ink">
              No notifications
            </Text>
            <Text className="px-10 text-center text-sm text-slate-400">
              You’re all caught up. New updates will land here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
