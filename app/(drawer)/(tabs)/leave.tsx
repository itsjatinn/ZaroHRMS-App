import { useRouter } from 'expo-router';
import {
  Activity,
  CalendarDays,
  MapPin,
  Plus,
  RotateCcw,
  Smile,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackButton from '../../../src/components/BackButton';
import Dropdown from '../../../src/components/leave/Dropdown';
import StatCard from '../../../src/components/leave/StatCard';
import { cardShadow } from '../../../src/components/shadow';

// ---- Static demo data ----
const YEARS = ['2026', '2025', '2024'] as const;

const STATS = [
  { label: 'Paternity', value: 10, icon: Smile, color: '#D9A53B', badge: 'bg-amber-100' },
  { label: 'Sick Leave', value: 8, icon: Activity, color: '#059669', badge: 'bg-emerald-100' },
  { label: 'Annual Leave', value: 12, icon: CalendarDays, color: '#2563EB', badge: 'bg-blue-100' },
];

export default function LeaveOverviewScreen() {
  const router = useRouter();
  const [year, setYear] = useState<string>('2026');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-6 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <Text className="text-xl font-bold text-ink">
            Balance overview & requests
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-400">
            Track leave balances, regularizations, and attendance snapshots at a
            glance.
          </Text>
        </View>

        {/* Action buttons */}
        <View className="gap-3">
          <Pressable
            onPress={() => router.push('/apply-leave')}
            style={cardShadow}
            className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#14323F] active:scale-[0.98]"
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">Apply Leave</Text>
          </Pressable>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/regularize')}
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#14323F] active:scale-[0.98]"
            >
              <RotateCcw size={16} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">Regularize</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/regularize')}
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white active:scale-[0.98]"
            >
              <MapPin size={16} color="#14323F" />
              <Text numberOfLines={1} className="text-sm font-semibold text-ink">
                Outdoor/WFH
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Year selector */}
        <View className="flex-row items-center gap-3">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Year
          </Text>
          <Dropdown
            className="w-28"
            value={year}
            placeholder="2026"
            options={YEARS}
            onSelect={setYear}
          />
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3">
          {STATS.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              iconColor={s.color}
              badgeClass={s.badge}
              className="flex-1"
            />
          ))}
        </View>

        {/* Leave Requests */}
        <View style={cardShadow} className="rounded-[24px] border border-slate-100 bg-white p-5">
          <Text className="text-base font-bold text-ink">Leave Requests</Text>
          <Pressable hitSlop={6} className="mt-1 self-start active:opacity-60">
            <Text className="text-xs font-semibold text-blue-600">View All</Text>
          </Pressable>

          {/* Column headers (matches the reference: 4 columns) */}
          <View className="mt-4 flex-row border-b border-slate-100 pb-2.5">
            <Text className="flex-[2.1] text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Leave Period
            </Text>
            <Text className="flex-[1.6] text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Leave Type
            </Text>
            <Text className="flex-[1.5] text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              No. of Days
            </Text>
            <Text className="flex-[1.7] text-right text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Request Status
            </Text>
          </View>

          {/* Empty state */}
          <Text className="py-8 text-sm text-slate-400">
            Unable to load requests.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
