import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from './shadow';

const FEATURED = {
  day: '23',
  month: 'JUN',
  countdown: 'IN 4 DAYS',
  title: 'Buddha Purnima',
  tag: 'Festival',
  note: 'Office closed',
};

type Holiday = {
  day: string;
  month: string;
  title: string;
  note: string;
  boxBg: string;
  boxText: string;
};

const HOLIDAYS: Holiday[] = [
  {
    day: '14',
    month: 'JUL',
    title: 'Eid al-Adha',
    note: 'Restricted · Restricted · pick 2 of 5',
    boxBg: '#F0E2B6',
    boxText: '#B8881F',
  },
  {
    day: '29',
    month: 'JUL',
    title: "Founders' Day",
    note: 'Optional · Optional · floater',
    boxBg: '#E0DBF5',
    boxText: '#6B5FCF',
  },
  {
    day: '13',
    month: 'SEPT',
    title: 'Independence Day',
    note: 'Festival · Office closed',
    boxBg: '#F6DDD3',
    boxText: '#C0552F',
  },
];

export default function UpcomingHolidaysCard() {
  const router = useRouter();

  return (
    <View style={cardShadow} className="rounded-3xl bg-white p-6">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">Upcoming holidays</Text>
        <Pressable
          onPress={() => router.push('/holidays')}
          hitSlop={8}
          className="flex-row items-center gap-1"
        >
          <Text className="text-sm font-semibold text-slate-500">Full list</Text>
          <Feather name="arrow-right" size={15} color="#64748B" />
        </Pressable>
      </View>

      {/* Featured holiday */}
      <View className="mt-6 flex-row items-center gap-4 rounded-2xl bg-[#FBEDE7] p-3.5">
        <View className="h-16 w-16 items-center justify-center rounded-xl border border-rose-100 bg-white">
          <Text className="text-2xl font-bold text-ink">{FEATURED.day}</Text>
          <Text className="text-[11px] font-semibold uppercase text-slate-400">
            {FEATURED.month}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#C0552F]">
            {FEATURED.countdown}
          </Text>
          <Text className="mt-0.5 text-lg font-bold text-ink">
            {FEATURED.title}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <View className="rounded-md bg-[#F6D8CE] px-2 py-0.5">
              <Text className="text-xs font-semibold text-[#C0552F]">
                {FEATURED.tag}
              </Text>
            </View>
            <Text className="text-xs text-slate-400">· {FEATURED.note}</Text>
          </View>
        </View>
      </View>

      {/* Holiday list */}
      <View className="mt-6">
        {HOLIDAYS.map((h, i) => (
          <Fragment key={h.title}>
            {i > 0 && (
              <View className="my-4 border-b border-dashed border-slate-200" />
            )}
            <View className="flex-row items-center gap-4">
              <View
                className="h-14 w-14 items-center justify-center rounded-xl"
                style={{ backgroundColor: h.boxBg }}
              >
                <Text
                  className="text-xl font-bold"
                  style={{ color: h.boxText }}
                >
                  {h.day}
                </Text>
                <Text
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: h.boxText }}
                >
                  {h.month}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-ink">{h.title}</Text>
                <Text className="text-xs text-slate-400">{h.note}</Text>
              </View>
            </View>
          </Fragment>
        ))}
      </View>
    </View>
  );
}
