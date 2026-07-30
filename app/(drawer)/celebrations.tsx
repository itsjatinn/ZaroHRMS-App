import { useRouter } from 'expo-router';
import { PartyPopper, Search, Sparkles, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import CelebrationCard from '../../src/components/celebrations/CelebrationCard';
import {
  CELEBRATIONS,
  dayKey,
  formatDayLabel,
  formatFullDate,
  inNextNDays,
  KIND_META,
  KIND_OPTIONS,
  RANGE_DAYS,
  RANGE_OPTIONS,
  type Celebration,
  type KindFilter,
  type RangeKey,
} from '../../src/components/celebrations/celebrationsData';
import WishComposerSheet from '../../src/components/celebrations/WishComposerSheet';
import Dropdown from '../../src/components/leave/Dropdown';
import { cardShadow } from '../../src/components/shadow';

const RANGE_LABELS = RANGE_OPTIONS.map((o) => o.label);

export default function Celebrations() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [kind, setKind] = useState<KindFilter>('all');
  const [range, setRange] = useState<RangeKey>('month');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState<Celebration | null>(null);
  /** Ids already wished this session — keeps the card's sent state sticky. */
  const [wished, setWished] = useState<Set<string>>(() => new Set());

  const rangeLabel =
    RANGE_OPTIONS.find((o) => o.value === range)?.label ?? 'This month';

  // Everything happening today gets its own hero strip, so it is excluded
  // from the upcoming list below to avoid showing the same person twice.
  const todayItems = useMemo(
    () => CELEBRATIONS.filter((c) => inNextNDays(c.date, 0)),
    [],
  );

  const upcoming = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CELEBRATIONS.filter((c) => {
      if (!inNextNDays(c.date, RANGE_DAYS[range])) return false;
      if (inNextNDays(c.date, 0)) return false;
      if (kind !== 'all' && c.kind !== kind) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.designation ?? '').toLowerCase().includes(q) ||
        (c.team ?? '').toLowerCase().includes(q)
      );
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [kind, query, range]);

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

  // Mock send — the real flow will post to /api/celebrations/{id}/wish.
  const sendWish = (c: Celebration) => {
    setWished((prev) => {
      const next = new Set(prev);
      next.add(c.id);
      return next;
    });
    setComposing(null);
    Alert.alert(
      `${KIND_META[c.kind].label} note sent`,
      `Your note has been sent to ${c.name}.`,
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <View className="z-10">
        <View className="flex-row items-end gap-2 pr-4">
          <View className="flex-1">
            <BackButton
              title="Celebrations"
              subtitle={`${todayItems.length} today · ${upcoming.length} upcoming`}
            />
          </View>
          <Dropdown
            className="mb-1 w-36"
            value={rangeLabel}
            placeholder="This month"
            options={RANGE_LABELS}
            onSelect={(label) => {
              const next = RANGE_OPTIONS.find((o) => o.label === label);
              if (next) setRange(next.value);
            }}
          />
        </View>

        {/* Search */}
        <View className="px-4 pt-2">
          <View
            style={cardShadow}
            className="h-12 flex-row items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5"
          >
            <Search size={17} color="#94A3B8" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, role, team…"
              placeholderTextColor="#94A3B8"
              className="flex-1 text-sm text-ink"
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <X size={16} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Type filter — scrollable chips keep all four labels readable. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 grow-0"
          contentContainerClassName="gap-2 px-4"
        >
          {KIND_OPTIONS.map((option) => {
            const active = option.value === kind;
            return (
              <Pressable
                key={option.value}
                onPress={() => setKind(option.value)}
                style={active ? undefined : cardShadow}
                className={`rounded-full border px-3.5 py-2 ${
                  active
                    ? 'border-[#14323F] bg-[#14323F]'
                    : 'border-slate-200 bg-white active:scale-95'
                }`}
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    active ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-5 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Today's hero — only rendered when something is actually happening. */}
        {todayItems.length > 0 ? (
          <View>
            <View className="mb-3 flex-row items-center gap-2">
              <Sparkles size={14} color="#B8881F" />
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Today
              </Text>
              <Text className="text-[11px] font-semibold text-ink">
                · {todayItems.length}{' '}
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

        {/* Upcoming timeline, grouped by day */}
        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Upcoming
            </Text>
            <Text className="text-[11px] text-slate-400">
              {upcoming.length}{' '}
              {upcoming.length === 1 ? 'celebration' : 'celebrations'}
            </Text>
          </View>

          {grouped.length === 0 ? (
            <View
              style={cardShadow}
              className="items-center rounded-[24px] border border-slate-100 bg-white px-6 py-10"
            >
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <PartyPopper size={24} color="#94A3B8" />
              </View>
              <Text className="mt-4 text-base font-bold text-ink">
                Nothing on the calendar
              </Text>
              <Text className="mt-1 text-center text-xs text-slate-400">
                No celebrations match this range or filter.
              </Text>
            </View>
          ) : (
            <View className="gap-5">
              {grouped.map((group) => (
                <View key={group.key}>
                  <View className="mb-2.5 flex-row items-center gap-2">
                    <View className="h-1.5 w-1.5 rounded-full bg-[#F5D14E]" />
                    <Text className="text-[13px] font-bold text-ink">
                      {formatDayLabel(group.iso)}
                    </Text>
                    <Text className="text-[11px] text-slate-400">
                      · {formatFullDate(group.iso)}
                    </Text>
                  </View>
                  <View className="gap-3">
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
