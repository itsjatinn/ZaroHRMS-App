import { useRouter } from 'expo-router';
import { BellOff, CheckCheck, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
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
import FilterSheet, { FilterIconButton } from '../../src/components/FilterSheet';
import PageLoading from '../../src/components/PageLoading';
import NotificationCard from '../../src/components/notifications/NotificationCard';
import { DEMO_NOTIFICATIONS } from '../../src/components/notifications/notificationsStore';
import {
  dayBucket,
  describeNotification,
  FILTER_MODULE,
  NOTIFICATION_FILTERS,
  type NotificationFilterId,
} from '../../src/components/notifications/notificationTypes';

/** Recency buckets, newest first. Anything older falls into a month heading
 *  ("July 2026"), appended in the order the rows arrive (newest first). */
const DAY_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier this month'] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const { isBackendSession } = useAuth();
  const gate = useModuleGate(isBackendSession);

  const [filter, setFilter] = useState<NotificationFilterId>('all');
  const [filterOpen, setFilterOpen] = useState(false);

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
    const byBucket = new Map<string, ServerNotification[]>();
    // Insertion order = feed order (newest first), which is what month
    // headings need; the fixed recency buckets are hoisted above them.
    for (const row of visible) {
      const key = dayBucket(row.createdAt);
      const bucket = byBucket.get(key);
      if (bucket) bucket.push(row);
      else byBucket.set(key, [row]);
    }
    const sections: { day: string; items: ServerNotification[] }[] = [];
    for (const day of DAY_ORDER) {
      const rows = byBucket.get(day);
      if (rows?.length) sections.push({ day, items: rows });
      byBucket.delete(day);
    }
    for (const [day, items] of byBucket) sections.push({ day, items });
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
      <View className="flex-row items-start pr-4">
        <View className="flex-1">
          <BackButton
            title="Notifications"
          />
        </View>
        <View className="pt-2">
          <FilterIconButton onPress={() => setFilterOpen(true)} />
        </View>
      </View>

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
          <PageLoading label="Loading notifications..." />
        ) : grouped.length > 0 ? (
          <>
            {grouped.map((section, i) => (
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
            ))}
            {/* Side by side — two stacked full-width bars read as a bigger
                decision than either action deserves. Each flexes so the pair
                still fills the row when only one is shown. */}
            <View className="mt-6 flex-row gap-2">
              {unreadCount > 0 ? (
                <Pressable
                  onPress={() => isBackendSession && markAllRead.mutate(undefined)}
                  accessibilityRole="button"
                  className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-[12px] border border-slate-200 bg-white active:opacity-70"
                >
                  <CheckCheck size={15} color="#14323F" />
                  <Text
                    numberOfLines={1}
                    className="text-[13px] font-bold text-ink"
                  >
                    Mark all read
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={confirmClearAll}
                accessibilityRole="button"
                className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-[12px] border border-rose-200 bg-white active:opacity-70"
              >
                <Trash2 size={15} color="#F43F5E" />
                <Text
                  numberOfLines={1}
                  className="text-[13px] font-bold text-rose-500"
                >
                  Clear all
                </Text>
              </Pressable>
            </View>
          </>
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
      <FilterSheet
        visible={filterOpen}
        title="Notifications"
        value={filter}
        options={availableFilters.map((entry) => {
          const Icon = entry.icon;
          return {
            value: entry.id,
            label: entry.label,
            count: entry.id === 'unread' ? unreadCount : null,
            icon: (color: string) => <Icon size={16} color={color} />,
          };
        })}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}
