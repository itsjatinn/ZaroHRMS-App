import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
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
  const router = useRouter();

  const [kind, setKind] = useState<KindFilter>('all');
  const [composing, setComposing] = useState<Celebration | null>(null);
  /** Ids already wished this session — keeps the card's sent state sticky. */
  const [wished, setWished] = useState<Set<string>>(() => new Set());

  // Everything happening today gets its own hero strip, so it is excluded
  // from the upcoming list below to avoid showing the same person twice.
  // The type filter applies here too — a chip that hid only half the page
  // read as broken.
  const todayItems = useMemo(
    () =>
      CELEBRATIONS.filter((c) => {
        if (!inNextNDays(c.date, 0)) return false;
        return kind === 'all' || c.kind === kind;
      }),
    [kind],
  );

  const upcoming = useMemo(() => {
    return CELEBRATIONS.filter((c) => {
      if (!inNextNDays(c.date, UPCOMING_DAYS)) return false;
      if (inNextNDays(c.date, 0)) return false;
      if (kind !== 'all' && c.kind !== kind) return false;
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [kind]);

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

  const openProfile = () => router.push('/view-profile');

  // Mock send — the real flow will post to /api/celebrations/{id}/wish. The
  // card flips into its sent state, same as the web page.
  const sendWish = (c: Celebration) => {
    setWished((prev) => {
      const next = new Set(prev);
      next.add(c.id);
      return next;
    });
    setComposing(null);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton
        title="Celebrations"
        subtitle="Birthdays, anniversaries, and new joiners across your team"
      />

      {/* Slideable type filter — kept outside the vertical ScrollView; the
          nested horizontal-in-vertical ScrollView combination swallows taps
          under the new architecture. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2 grow-0"
        contentContainerClassName="gap-2 px-4"
      >
        {KIND_OPTIONS.map((opt) => {
          const active = opt.value === kind;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setKind(opt.value)}
              className="h-8 items-center justify-center rounded-full border px-3.5"
              style={{
                backgroundColor: active ? BRAND_PRIMARY : '#FFFFFF',
                borderColor: active ? BRAND_PRIMARY : brandAlpha(0.15),
              }}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{ color: active ? '#FFFFFF' : brandAlpha(0.65) }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

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
                  wished={wished.has(c.id)}
                  onPressPerson={openProfile}
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
                        wished={wished.has(c.id)}
                        onPressPerson={openProfile}
                        onPressAction={setComposing}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <WishComposerSheet
        celebration={composing}
        onSend={sendWish}
        onClose={() => setComposing(null)}
      />
    </SafeAreaView>
  );
}
