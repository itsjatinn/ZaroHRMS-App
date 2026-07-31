import { Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { ServerNotification } from '../../api/notifications';
import { cardShadow } from '../shadow';
import {
  describeNotification,
  formatRelativeTime,
  TONE_STYLE,
} from './notificationTypes';

type NotificationCardProps = {
  item: ServerNotification;
  /** Unread rows carry a tinted glyph, an accent edge and the dot. */
  unread: boolean;
  onPress?: () => void;
  onDelete?: () => void;
};

/**
 * One feed row — the web's notification row ported: a tone-tinted glyph chip
 * keyed off the notification type, title + body, relative time, an unread dot
 * and accent edge, and a delete control.
 */
export default function NotificationCard({
  item,
  unread,
  onPress,
  onDelete,
}: NotificationCardProps) {
  const descriptor = describeNotification(item.type);
  const Icon = descriptor.icon;
  const tone = TONE_STYLE[descriptor.tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        cardShadow,
        // Unread rows take the type's own hue on their leading edge, so the
        // feed scans by category as well as by freshness.
        unread ? { borderLeftWidth: 3, borderLeftColor: tone.color } : null,
      ]}
      className="flex-row gap-3 rounded-[22px] border border-slate-100 bg-white p-4 active:bg-slate-50"
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: tone.bg }}
      >
        <Icon size={20} color={tone.color} strokeWidth={1.9} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className={`flex-1 text-sm ${unread ? 'font-bold text-ink' : 'font-semibold text-slate-600'}`}
          >
            {item.title}
          </Text>
          {unread ? (
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tone.color }}
            />
          ) : null}
          <Text className="text-[11px] font-medium text-slate-400">
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        {item.body ? (
          <Text
            numberOfLines={2}
            className="mt-0.5 text-xs leading-4 text-slate-500"
          >
            {item.body}
          </Text>
        ) : null}

        <View className="mt-1.5 flex-row items-center gap-2">
          <Text
            className="rounded-full px-2 py-[2px] text-[10px] font-bold"
            style={{ backgroundColor: tone.bg, color: tone.color }}
          >
            {descriptor.group}
          </Text>
          <View className="flex-1" />
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.title}`}
              className="h-7 w-7 items-center justify-center rounded-full active:bg-slate-100"
            >
              <Trash2 size={14} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
