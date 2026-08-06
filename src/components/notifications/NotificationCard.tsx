import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
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

  // Long messages are clamped to two lines in the feed. Rather than forcing a
  // navigation just to read the rest, the row expands in place.
  const [expanded, setExpanded] = useState(false);
  // `onTextLayout` clamps to `numberOfLines` on some platforms, so it cannot
  // be trusted alone. It is combined with a length estimate: either signal is
  // enough to offer the toggle, and an unnecessary "More" simply expands to
  // the same text.
  const [measuredLong, setMeasuredLong] = useState(false);
  const body = item.body ?? '';
  // Thresholds sized for the narrowest supported screens — text that clamps
  // with no toggle is unreachable, while a needless "More" merely expands to
  // the same message.
  const likelyLong = body.length > 64 || item.title.length > 30;
  const canExpand = Boolean(body) && (measuredLong || likelyLong);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={cardShadow}
      className="flex-row items-start gap-3 rounded-[22px] border border-slate-100 bg-white p-4 active:bg-slate-50"
    >
      {/* Standalone accent bar rather than a full-height card edge: it marks
          the row as unread without recolouring the whole card outline. */}
      <View
        className="mt-1 h-9 w-1 rounded-full"
        style={{ backgroundColor: unread ? tone.color : 'transparent' }}
      />

      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: tone.bg }}
      >
        <Icon size={20} color={tone.color} strokeWidth={1.9} />
      </View>

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={expanded ? undefined : 1}
          className={`text-[15px] leading-5 ${unread ? 'font-bold text-ink' : 'font-semibold text-slate-600'}`}
        >
          {item.title}
        </Text>

        {body ? (
          <View className="mt-1 flex-row items-end gap-2">
            <Text
              numberOfLines={expanded ? undefined : 2}
              onTextLayout={(event) => {
                if (event.nativeEvent.lines.length > 2) setMeasuredLong(true);
              }}
              // Tapping the message toggles too — the small label isn't the
              // only target. Nested Press capture keeps the card's own
              // navigation out of it.
              onPress={canExpand ? () => setExpanded((v) => !v) : undefined}
              className="min-w-0 flex-1 text-[13px] leading-[18px] text-slate-500"
            >
              {body}
            </Text>

            {/* Beside the text, not down in the meta row — it belongs to the
                message it expands. */}
            {canExpand ? (
              <Pressable
                onPress={() => setExpanded((value) => !value)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  expanded
                    ? 'Show less'
                    : `Show the full message for ${item.title}`
                }
                className="shrink-0 flex-row items-center gap-0.5 rounded-full px-1 py-[2px] active:bg-slate-100"
              >
                <Text className="text-[10.5px] font-bold text-slate-500">
                  {expanded ? 'Less' : 'More'}
                </Text>
                {expanded ? (
                  <ChevronUp size={11} color="#64748B" />
                ) : (
                  <ChevronDown size={11} color="#64748B" />
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Meta line: when it happened and which module it came from, as
            quiet uppercase text rather than a coloured pill. */}
        <View className="mt-2 flex-row items-center gap-2">
          <Text className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            {formatRelativeTime(item.createdAt)} · {descriptor.group}
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
