import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import type { AppNotification } from './notificationsStore';

type NotificationCardProps = {
  item: AppNotification;
  /** Whether this item was unread when the screen opened (drives the dot). */
  highlight: boolean;
};

// A single feed row: neutral ink-on-slate icon tile matching RequestCard,
// title + body, relative time, and a gold dot while the item is fresh.
export default function NotificationCard({
  item,
  highlight,
}: NotificationCardProps) {
  const router = useRouter();
  const Icon = item.icon;

  const open = item.href
    ? () => router.push(item.href as never)
    : undefined;

  return (
    <Pressable
      onPress={open}
      disabled={!open}
      style={cardShadow}
      className="flex-row gap-3 rounded-3xl border border-slate-100 bg-white p-4 active:bg-slate-50"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
        <Icon size={20} color="#14323F" strokeWidth={1.75} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className="flex-1 text-sm font-bold text-ink"
          >
            {item.title}
          </Text>
          {highlight ? (
            <View className="h-2 w-2 rounded-full bg-gold" />
          ) : null}
          <Text className="text-[11px] font-medium text-slate-400">
            {item.time}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          className="mt-0.5 text-xs leading-4 text-slate-500"
        >
          {item.body}
        </Text>
      </View>
    </Pressable>
  );
}
