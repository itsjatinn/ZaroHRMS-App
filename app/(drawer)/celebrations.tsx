import { Info, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Alert } from '../../src/components/CrossAlert';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  useMyCelebrations,
  useSendCelebrationWish,
  wishKey,
  type WishTarget,
} from '../../src/api/celebrations';
import { useAuth } from '../../src/auth/AuthContext';
import BackButton from '../../src/components/BackButton';
import AppScrollView from '../../src/components/AppScrollView';
import FilterSheet, { FilterIconButton } from '../../src/components/FilterSheet';
import PageLoading from '../../src/components/PageLoading';
import CelebrationCard from '../../src/components/celebrations/CelebrationCard';
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  brandAlpha,
  CELEBRATIONS,
  dayKey,
  formatDayLabel,
  formatFullDate,
  inNextNDays,
  KIND_OPTIONS,
  UPCOMING_DAYS,
  type Celebration,
  type KindFilter,
} from '../../src/components/celebrations/celebrationsData';
import WishComposerSheet from '../../src/components/celebrations/WishComposerSheet';

export default function Celebrations() {
  const insets = useSafeAreaInsets();
  const { isBackendSession } = useAuth();

  const [kind, setKind] = useState<KindFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [composing, setComposing] = useState<Celebration | null>(null);
  /** Occasions wished this session — merged with the server's `wished` flag. */
  const [justWished, setJustWished] = useState<Set<string>>(() => new Set());

  // Live rows from the same endpoint the web page reads; the offline demo
  // session keeps the sample list (no token to fetch with).
  const celebrationsQuery = useMyCelebrations(isBackendSession);
  const sendWishMutation = useSendCelebrationWish();
  const items = isBackendSession
    ? (celebrationsQuery.data ?? [])
    : CELEBRATIONS;

  /** The occasion identity a wish posts with — year falls back to the date. */
  const targetFor = (c: Celebration): WishTarget => ({
    employeeId: c.employeeId,
    kind: c.kind,
    year: c.year ?? new Date(c.date).getFullYear(),
  });

  // Server `wished` covers reloads and other devices; justWished covers taps
  // that haven't round-tripped yet — the same merge the web makes.
  const isWished = (c: Celebration) =>
    Boolean(c.wished) || justWished.has(wishKey(targetFor(c)));

  // Everything happening today gets its own hero strip, so it is excluded
  // from the upcoming list below to avoid showing the same person twice.
  // The type filter applies here too — a chip that hid only half the page
  // read as broken.
  const todayItems = useMemo(
    () =>
      items.filter((c) => {
        if (!inNextNDays(c.date, 0)) return false;
        return kind === 'all' || c.kind === kind;
      }),
    [items, kind],
  );

  const upcoming = useMemo(() => {
    return items.filter((c) => {
      if (!inNextNDays(c.date, UPCOMING_DAYS)) return false;
      if (inNextNDays(c.date, 0)) return false;
      if (kind !== 'all' && c.kind !== kind) return false;
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items, kind]);

  // Collapse the sorted list into one section per day so it reads as a timeline.
  const grouped = useMemo(() => {
    const out: { key: string; iso: string; items: Celebration[] }[] = [];
    for (const c of upcoming) {
      const key = dayKey(c.date);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(c);
      else out.push({ key, iso: c.date, items: [c] });
    }
    return out;
  }, [upcoming]);

  // Posts the wish with the occasion's identity; the card flips into its sent
  // state optimistically and the list refresh confirms it, as on the web. The
  // demo session keeps the tap local.
  const sendWish = (c: Celebration, message?: string) => {
    const target = targetFor(c);
    const markSent = () =>
      setJustWished((prev) => new Set(prev).add(wishKey(target)));

    if (!isBackendSession) {
      markSent();
      setComposing(null);
      return;
    }

    sendWishMutation.mutate(
      { ...target, message: message?.trim() || undefined },
      {
        onSuccess: markSent,
        onError: (error) => {
          Alert.alert(
            'Could not send your wish',
            error instanceof Error && error.message
              ? error.message
              : 'Please try again in a moment.',
          );
        },
      },
    );
    setComposing(null);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <View className="flex-row items-start pr-4">
        <View className="flex-1">
          <BackButton
            title="Celebrations"
          />
        </View>
        <View className="pt-2">
          <FilterIconButton onPress={() => setFilterOpen(true)} />
        </View>
      </View>

      <AppScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {isBackendSession && celebrationsQuery.isPending ? (
          <PageLoading label="Loading celebrations..." />
        ) : (
          <>

        {/* Today — label on the canvas, no wrapper panel. The cards carry a
            kind-coloured border instead, so they still stand out. */}
        {todayItems.length > 0 ? (
          <View>
            <View className="mb-3 flex-row flex-wrap items-center gap-2">
              <View
                className="flex-row items-center gap-1 rounded-full px-2 py-[2px]"
                style={{ backgroundColor: 'rgba(212, 162, 74, 0.25)' }}
              >
                <Sparkles size={12} color="#A37526" />
                <Text
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#A37526' }}
                >
                  Today
                </Text>
              </View>
              <Text className="text-xs" style={{ color: brandAlpha(0.55) }}>
                {todayItems.length}{' '}
                {todayItems.length === 1 ? 'celebration' : 'celebrations'}
              </Text>
            </View>
            <View className="gap-3">
              {todayItems.map((c) => (
                <CelebrationCard
                  key={c.id}
                  celebration={c}
                  highlight
                  wished={isWished(c)}
                  onPressAction={setComposing}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Upcoming timeline — the section label sits on the canvas so the
            celebration cards are the only surfaces, as on Announcements. */}
        <View>
          <View className="mb-3 flex-row items-baseline justify-between gap-2">
            <Text
              className="text-[15px] font-bold"
              style={{ color: BRAND_PRIMARY }}
            >
              Upcoming
            </Text>
            <Text className="text-xs" style={{ color: brandAlpha(0.55) }}>
              {upcoming.length}{' '}
              {upcoming.length === 1 ? 'celebration' : 'celebrations'}
            </Text>
          </View>

          {/* Why upcoming cards carry no button — same note as the web panel. */}
          <View
            className="mb-3 flex-row items-start gap-1.5 rounded-lg px-2.5 py-2"
            style={{ backgroundColor: brandAlpha(0.05) }}
          >
            <Info size={13} color={brandAlpha(0.55)} style={{ marginTop: 1 }} />
            <Text
              className="flex-1 text-[11px] leading-[16px]"
              style={{ color: brandAlpha(0.7) }}
            >
              Wishing opens on the day itself for birthdays and wedding
              anniversaries. Work anniversaries and new joiners stay open for 7
              days after the date.
            </Text>
          </View>

          {grouped.length === 0 ? (
            <Text
              className="py-6 text-center text-sm"
              style={{ color: brandAlpha(0.55) }}
            >
              Nothing on the calendar for the next 7 days.
            </Text>
          ) : (
            <View className="gap-4">
              {grouped.map((group) => (
                <View key={group.key}>
                  <View className="flex-row items-center gap-1.5">
                    {/* Timeline dot with its soft halo ring */}
                    <View
                      className="h-3.5 w-3.5 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(91, 90, 184, 0.12)' }}
                    >
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: BRAND_SECONDARY }}
                      />
                    </View>
                    <Text
                      className="text-[13px] font-bold"
                      style={{ color: BRAND_PRIMARY }}
                    >
                      {formatDayLabel(group.iso)}
                    </Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: brandAlpha(0.55) }}
                    >
                      · {formatFullDate(group.iso)}
                    </Text>
                  </View>
                  <View className="mt-2 gap-3">
                    {group.items.map((c) => (
                      <CelebrationCard
                        key={c.id}
                        celebration={c}
                        wished={isWished(c)}
                              onPressAction={setComposing}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
          </>
        )}
      </AppScrollView>

      <WishComposerSheet
        celebration={composing}
        onSend={sendWish}
        onClose={() => setComposing(null)}
      />
      <FilterSheet
        visible={filterOpen}
        title="Celebrations"
        value={kind}
        options={KIND_OPTIONS}
        onChange={setKind}
        onClose={() => setFilterOpen(false)}
      />
    </SafeAreaView>
  );
}
