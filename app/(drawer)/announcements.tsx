import { useRouter } from 'expo-router';
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  Megaphone,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  useAnnouncementSettings,
  useMarkAnnouncementRead,
  useMyAnnouncements,
} from '../../src/api/announcements';
import AnnouncementCard from '../../src/components/announcements/AnnouncementCard';
import {
  BRAND_PRIMARY,
  brandAlpha,
  FILTER_OPTIONS,
  type FilterValue,
} from '../../src/components/announcements/announcementsData';
import {
  DEMO_ANNOUNCEMENTS,
  FORCE_DEMO_ANNOUNCEMENTS,
} from '../../src/components/announcements/demoAnnouncements';
import FilterSheet, { FilterIconButton } from '../../src/components/FilterSheet';
import PageLoading from '../../src/components/PageLoading';
import { useAuth } from '../../src/auth/AuthContext';

/** Fallback until the HR-configured retention loads (the server default). */
const DEFAULT_RETENTION_DAYS = 30;

export default function Announcements() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // isBackendSession, not isAuthenticated: the offline demo session counts as
  // authenticated but holds no bearer token, so querying under it would 401 —
  // and the client turns an unrecoverable 401 into a sign-out.
  const { isBackendSession } = useAuth();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const [filter, setFilter] = useState<FilterValue>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  /** Ids read in this session — merged with the server's readAt below. */
  const [locallyRead, setLocallyRead] = useState<Record<string, string>>({});

  // Demo mode: the offline demo session has no bearer token to fetch with, so
  // the sample set stands in. In this mode the screen makes no network calls at
  // all — a token-less request would 401, and the client treats an
  // unrecoverable 401 as a dead session and signs the user out.
  const demoMode = !isBackendSession || FORCE_DEMO_ANNOUNCEMENTS;

  const announcements = useMyAnnouncements(!demoMode);
  // HR sets how long read announcements stay in the Archive; the web reads the
  // same setting. Falls back to the server default while loading and on demo.
  const settingsQuery = useAnnouncementSettings(!demoMode);
  const retentionDays =
    settingsQuery.data?.archiveRetentionDays && settingsQuery.data.archiveRetentionDays > 0
      ? settingsQuery.data.archiveRetentionDays
      : DEFAULT_RETENTION_DAYS;
  const markRead = useMarkAnnouncementRead();
  const items = demoMode ? DEMO_ANNOUNCEMENTS : (announcements.data ?? []);

  // The server's readAt covers other devices; locallyRead covers taps that
  // haven't round-tripped yet.
  const readMap = useMemo(() => {
    const merged: Record<string, string> = { ...locallyRead };
    for (const item of items) {
      if (item.readAt && !merged[item.id]) merged[item.id] = item.readAt;
    }
    return merged;
  }, [items, locallyRead]);

  const unreadCount = useMemo(
    () => items.filter((item) => !readMap[item.id]).length,
    [items, readMap],
  );

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.sentAt ?? 0).getTime() - new Date(a.sentAt ?? 0).getTime(),
      ),
    [items],
  );

  const featured = useMemo(
    () => sorted.find((item) => item.featured) ?? null,
    [sorted],
  );

  /** Read announcements still inside the retention window. */
  const archived = useMemo(() => {
    const cutoff = Date.now() - retentionDays * 86400000;
    return sorted.filter((item) => {
      const readAt = readMap[item.id];
      return Boolean(readAt) && new Date(readAt).getTime() >= cutoff;
    });
  }, [sorted, readMap, retentionDays]);

  const visible = useMemo(() => {
    if (showArchive) return archived;
    return sorted.filter((item) => {
      // The featured hero renders above the list, so skip it here to avoid
      // showing the same announcement twice.
      if (featured && item.id === featured.id && filter !== 'read') return false;
      if (filter === 'unread' && readMap[item.id]) return false;
      if (filter === 'read' && !readMap[item.id]) return false;
      return true;
    });
  }, [sorted, showArchive, archived, featured, filter, readMap]);

  const onMarkRead = (id: string) => {
    if (readMap[id]) return;
    setLocallyRead((current) => ({
      ...current,
      [id]: new Date().toISOString(),
    }));
    // Demo session: local only. Posting without a bearer token would 401, and
    // the client treats an unrecoverable 401 as a dead session and signs out.
    if (!demoMode) markRead.mutate(id);
  };

  const onMarkAllRead = () => {
    const now = new Date().toISOString();
    const next: Record<string, string> = {};
    for (const item of items) {
      if (!readMap[item.id]) {
        next[item.id] = now;
        if (!demoMode) markRead.mutate(item.id);
      }
    }
    if (Object.keys(next).length) {
      setLocallyRead((current) => ({ ...current, ...next }));
    }
  };

  const toggleExpand = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  const showFeaturedHero =
    !showArchive && featured !== null && filter !== 'read';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      {/* Header — back + title/subtitle, with the Archive toggle top-right */}
      <View className="flex-row items-center gap-3 px-4 pb-1 pt-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:scale-95"
        >
          <ChevronLeft size={22} color="#14323F" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text
            className="text-center text-[18px] font-bold leading-6 text-ink"
            numberOfLines={1}
          >
            Announcements
          </Text>
        </View>
        <FilterIconButton onPress={() => setFilterOpen(true)} />
        <Pressable
          onPress={() => setShowArchive((value) => !value)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={showArchive ? 'Back to inbox' : 'Archive'}
          accessibilityState={{ selected: showArchive }}
          className="h-10 w-10 items-center justify-center rounded-full active:scale-95"
          style={{
            backgroundColor: showArchive ? BRAND_PRIMARY : brandAlpha(0.06),
          }}
        >
          {showArchive ? (
            <ArrowLeft size={18} color="#FFFFFF" />
          ) : (
            <Archive size={18} color={BRAND_PRIMARY} />
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-2 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={!demoMode && announcements.isRefetching}
            // refetch() bypasses the query's `enabled` gate, so pull-to-refresh
            // has to be guarded too — otherwise a demo session would fire a
            // token-less request and get signed out.
            onRefresh={() => {
              if (!demoMode) void announcements.refetch();
            }}
            tintColor={brandAlpha(0.4)}
          />
        }
      >
        {/* Mark all read */}
        <View className="gap-2.5">
          {!showArchive && unreadCount > 0 ? (
            <Pressable
              onPress={onMarkAllRead}
              accessibilityRole="button"
              className="h-9 flex-row items-center justify-center gap-1.5 rounded-[10px] border bg-white active:opacity-70"
              style={{ borderColor: brandAlpha(0.12) }}
            >
              <CheckCircle2 size={13} color={BRAND_PRIMARY} />
              <Text
                className="text-[13px] font-bold"
                style={{ color: BRAND_PRIMARY }}
              >
                Mark all read
              </Text>
            </Pressable>
          ) : null}
        </View>

        {announcements.isPending && !demoMode ? (
          <PageLoading label="Loading announcements..." />
        ) : (
          <>
            {showFeaturedHero && featured ? (
              <AnnouncementCard
                announcement={featured}
                isFeaturedHero
                isRead={Boolean(readMap[featured.id])}
                isExpanded={expandedId === featured.id}
                onToggleExpand={() => toggleExpand(featured.id)}
                onMarkRead={() => onMarkRead(featured.id)}
                demo={demoMode}
              />
            ) : null}

            {/* Section label sits directly on the canvas — the announcement
                cards are the only surfaces, so nothing reads as nested. */}
            <View>
              <View className="mb-3 flex-row items-baseline justify-between gap-2">
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: BRAND_PRIMARY }}
                >
                  {showArchive ? 'Archive' : 'All announcements'}
                </Text>
                <Text className="text-xs" style={{ color: brandAlpha(0.55) }}>
                  {showArchive
                    ? `${visible.length} read · kept ${retentionDays} days`
                    : `${visible.length} ${
                        visible.length === 1 ? 'update' : 'updates'
                      }`}
                </Text>
              </View>

              {visible.length === 0 ? (
                <EmptyState
                  showArchive={showArchive}
                  filter={filter}
                  hasAny={items.length > 0}
                  isError={!demoMode && announcements.isError}
                  retentionDays={retentionDays}
                />
              ) : (
                <View className="gap-3">
                  {visible.map((item) => (
                    <AnnouncementCard
                      key={item.id}
                      announcement={item}
                      isRead={Boolean(readMap[item.id])}
                      isExpanded={expandedId === item.id}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onMarkRead={() => onMarkRead(item.id)}
                      demo={demoMode}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <FilterSheet
        visible={filterOpen}
        title="Announcements"
        value={filter}
        options={FILTER_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          count: option.value === 'unread' ? unreadCount : null,
        }))}
        onChange={(next) => {
          setShowArchive(false);
          setFilter(next);
        }}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}

function EmptyState({
  showArchive,
  filter,
  hasAny,
  isError,
  retentionDays,
}: {
  showArchive: boolean;
  filter: FilterValue;
  hasAny: boolean;
  isError: boolean;
  retentionDays: number;
}) {
  const headline = isError
    ? 'Could not load announcements.'
    : showArchive
      ? 'Your archive is empty.'
      : !hasAny
        ? 'No announcements yet.'
        : filter === 'unread'
          ? "You're all caught up."
          : filter === 'read'
            ? 'Nothing marked as read.'
            : 'No announcements to show.';

  const detail = showArchive
    ? `Announcements you mark as read appear here for ${retentionDays} days before being cleared.`
    : isError
      ? 'Pull down to retry.'
      : null;

  return (
    <View className="items-center gap-1.5 py-8">
      <Megaphone size={20} color={brandAlpha(0.4)} />
      <Text
        className="text-center text-sm font-bold"
        style={{ color: BRAND_PRIMARY }}
      >
        {headline}
      </Text>
      {detail ? (
        <Text
          className="text-center text-xs"
          style={{ color: brandAlpha(0.55) }}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
}
