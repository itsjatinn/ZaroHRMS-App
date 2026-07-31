import { useRouter } from 'expo-router';
import { BellOff, CheckCheck, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Alert } from '../../src/components/CrossAlert';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useModuleGate } from '../../src/api/modules';
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationFeed,
  type ServerNotification,
} from '../../src/api/notifications';
import { useAuth } from '../../src/auth/AuthContext';
import BackButton from '../../src/components/BackButton';
import NotificationCard from '../../src/components/notifications/NotificationCard';
import { DEMO_NOTIFICATIONS } from '../../src/components/notifications/notificationsStore';
import {
  dayBucket,
  describeNotification,
  FILTER_MODULE,
  NOTIFICATION_FILTERS,
  type NotificationFilterId,
} from '../../src/components/notifications/notificationTypes';

const DAY_ORDER = ['Today', 'Yesterday', 'Earlier'] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const { isBackendSession } = useAuth();
  const gate = useModuleGate(isBackendSession);

  const [filter, setFilter] = useState<NotificationFilterId>('all');

  // 'unread' goes to the server; typed groups are filtered client-side from
  // the full feed, exactly as the web does.
  const serverFilter = filter === 'unread' ? 'unread' : 'all';
  const feed = useNotificationFeed(serverFilter, isBackendSession);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const items: ServerNotification[] = isBackendSession
    ? (feed.data?.items ?? [])
    : DEMO_NOTIFICATIONS;

  // A filter only appears when its module is licensed — a disabled module's
  // tab would advertise a group that can never have rows.
  const availableFilters = useMemo(
    () =>
      NOTIFICATION_FILTERS.filter((entry) => {
        const required = FILTER_MODULE[entry.id];
        return !required || gate.has(required);
      }),
    [gate],
  );

  const visible = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((n) => !n.readAt);
    return items.filter((n) => describeNotification(n.type).group === filter);
  }, [items, filter]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items],
  );

  // Rows bucketed by day, newest bucket first.
  const grouped = useMemo(() => {
    const sections: { day: string; items: ServerNotification[] }[] = [];
    for (const day of DAY_ORDER) {
      const rows = visible.filter((n) => dayBucket(n.createdAt) === day);
      if (rows.length) sections.push({ day, items: rows });
    }
    return sections;
  }, [visible]);

  const open = (item: ServerNotification) => {
    if (isBackendSession && !item.readAt) markRead.mutate(item.id);
    // The backend sends web routes, so only links the app has a screen for are
    // followed — a tap can never dead-end on an unknown route.
    const link = item.link ?? '';
    const target = link.includes('leave')
      ? '/leave'
      : link.includes('attendance') || link.includes('regulari')
        ? '/attendance'
        : link.includes('announcement')
          ? '/announcements'
          : link.includes('payslip') || link.includes('payroll')
            ? '/payslip'
            : null;
    if (target) router.push(target as never);
  };

  const confirmClearAll = () => {
    Alert.alert(
      'Clear all notifications?',
      'This removes every notification from your inbox. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            if (isBackendSession) clearAll.mutate(undefined);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
      />

      {/* Filter spine — scrolls, and only shows licensed groups. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2 grow-0"
        contentContainerClassName="gap-2 px-4"
      >
        {availableFilters.map((entry) => {
          const active = entry.id === filter;
          const Icon = entry.icon;
          return (
            <Pressable
              key={entry.id}
              onPress={() => setFilter(entry.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className="h-8 flex-row items-center gap-1.5 rounded-full border px-3.5"
              style={{
                backgroundColor: active ? '#14323F' : '#FFFFFF',
                borderColor: active ? '#14323F' : 'rgba(13, 55, 73, 0.15)',
              }}
            >
              <Icon
                size={13}
                color={active ? '#FFFFFF' : 'rgba(13,55,73,0.65)'}
              />
              <Text
                className="text-[13px] font-semibold"
                style={{ color: active ? '#FFFFFF' : 'rgba(13, 55, 73, 0.65)' }}
              >
                {entry.label}
                {entry.id === 'unread' && unreadCount > 0
                  ? ` · ${unreadCount}`
                  : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bulk actions */}
      {items.length > 0 ? (
        <View className="mt-3 flex-row gap-2 px-4">
          {unreadCount > 0 ? (
            <Pressable
              onPress={() => isBackendSession && markAllRead.mutate(undefined)}
              accessibilityRole="button"
              className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 bg-white active:opacity-70"
            >
              <CheckCheck size={14} color="#14323F" />
              <Text className="text-[13px] font-bold text-ink">
                Mark all read
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={confirmClearAll}
            accessibilityRole="button"
            className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] border border-rose-200 bg-white active:opacity-70"
          >
            <Trash2 size={14} color="#F43F5E" />
            <Text className="text-[13px] font-bold text-rose-500">Clear all</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-32 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isBackendSession && feed.isRefetching}
            onRefresh={() => {
              if (isBackendSession) void feed.refetch();
            }}
            tintColor="rgba(13,55,73,0.4)"
          />
        }
      >
        {isBackendSession && feed.isPending ? (
          <View className="items-center gap-3 py-16">
            <ActivityIndicator color="rgba(13,55,73,0.4)" />
            <Text className="text-sm text-slate-400">
              Loading your notifications…
            </Text>
          </View>
        ) : grouped.length > 0 ? (
          grouped.map((section, i) => (
            <View key={section.day} className={i === 0 ? '' : 'mt-5'}>
              <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.day}
              </Text>
              <View className="gap-3">
                {section.items.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    unread={!item.readAt}
                    onPress={() => open(item)}
                    onDelete={
                      isBackendSession
                        ? () => deleteOne.mutate(item.id)
                        : undefined
                    }
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
              {filter === 'all' ? 'No notifications' : 'Nothing in this group'}
            </Text>
            <Text className="px-10 text-center text-sm text-slate-400">
              {filter === 'all'
                ? 'You’re all caught up. New updates will land here.'
                : 'Try a different filter.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
