import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Sidebar from '../components/Sidebar';

const STATS = [
  { value: '06', label: 'Tasks\nPending' },
  { value: '15', label: 'In\nProgress' },
  { value: '29', label: 'Completed\nToday' },
];

const CARDS = [
  { label: 'My Tasks',      sub: '34 new tasks added',  icon: 'list'      as const },
  { label: 'Leave Request', sub: '2 pending approval',  icon: 'calendar'  as const },
  { label: 'Payslip',       sub: 'Feb slip available',  icon: 'file-text' as const },
  { label: 'My Profile',    sub: 'Akash Mehta',         icon: 'user'      as const },
];

function Card({ card }: { card: (typeof CARDS)[number] }) {
  return (
    <Pressable
      className="flex-1 rounded-2xl bg-white p-4"
      style={{
        shadowColor: '#94a3b8',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
        elevation: 3,
      }}
      accessibilityRole="button"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#e5eef4]">
        <Feather name={card.icon} size={20} color="#0f2f3a" />
      </View>
      <Text className="mt-4 text-base font-semibold text-slate-800">{card.label}</Text>
      <Text className="mt-0.5 text-xs text-slate-400">{card.sub}</Text>
    </Pressable>
  );
}

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <View className="flex-1 bg-[#0f2f3a]">
      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <View className="absolute inset-0 z-20">
          {/* Full-screen dark backdrop — sits behind the panel so the
              rounded corner cut-away has a dark background to show against */}
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-black/70"
          />

          {/* Touch-handling layer */}
          <View className="absolute inset-0 flex-row">
            <View
              className="w-[72%] overflow-hidden"
              style={{ borderTopRightRadius: 32, borderBottomRightRadius: 32 }}
            >
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </View>
            <Pressable
              className="flex-1"
              onPress={() => setIsSidebarOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close menu overlay"
            />
          </View>
        </View>
      )}

      {/* ── Dark Header ── */}
      <View className="px-6 pt-14 pb-20">
        {/* Nav row */}
        <View className="flex-row items-center justify-between">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            onPress={() => setIsSidebarOpen(true)}
          >
            <View className="w-5 gap-[5px]">
              <View className="h-[2px] w-5 rounded-full bg-white" />
              <View className="h-[2px] w-3 rounded-full bg-white" />
              <View className="h-[2px] w-5 rounded-full bg-white" />
            </View>
          </Pressable>

          <Pressable
            className="relative h-10 w-10 items-center justify-center rounded-full bg-white/10"
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Feather name="bell" size={18} color="#ffffff" />
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />
          </Pressable>
        </View>

        {/* Greeting */}
        <Text className="mt-5 text-3xl font-bold text-white">Hello, Akash Mehta</Text>
        <Text className="mt-1 text-sm text-white/50">Monday, 3 Mar 2026</Text>

        {/* Stats row */}
        <View className="mt-8 flex-row">
          {STATS.map((stat, index) => (
            <View key={stat.value + stat.label} className="flex-1 items-center">
              <Text className="text-5xl font-bold text-white">{stat.value}</Text>
              <Text className="mt-2 text-center text-xs leading-4 text-white/55">
                {stat.label}
              </Text>
              {index < STATS.length - 1 && (
                <View
                  className="absolute right-0 top-3 w-px bg-white/20"
                  style={{ height: 32 }}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ── White Panel ── */}
      <View className="-mt-10 flex-1 rounded-t-[36px] bg-white px-6 pt-8 pb-8">
        {/* 2 × 2 card grid */}
        <View className="gap-4">
          <View className="flex-row gap-4">
            <Card card={CARDS[0]} />
            <Card card={CARDS[1]} />
          </View>
          <View className="flex-row gap-4">
            <Card card={CARDS[2]} />
            <Card card={CARDS[3]} />
          </View>
        </View>

        {/* Push button to bottom */}
        <View className="flex-1" />

        {/* CTA button */}
        <Pressable
          className="items-center justify-center rounded-2xl bg-amber-200 py-4"
          accessibilityRole="button"
        >
          <Text className="text-base font-semibold text-[#0f2f3a]">Raise a Request</Text>
        </Pressable>
      </View>
    </View>
  );
}
