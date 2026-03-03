import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Sidebar from '../components/Sidebar';

const QUICK_ACTIONS = [
  { label: 'Mark Attendance', icon: 'check-square' as const, color: '#0f2f3a', bg: '#e0eff5' },
  { label: 'Apply Leave',     icon: 'calendar'     as const, color: '#7c3aed', bg: '#ede9fe' },
  { label: 'View Payslip',    icon: 'file-text'    as const, color: '#b45309', bg: '#fef3c7' },
  { label: 'Raise Request',   icon: 'message-square' as const, color: '#047857', bg: '#d1fae5' },
];

const DUTIES = [
  { time: '09:00 AM', task: 'Blood Collection', location: 'Ward 3' },
  { time: '11:30 AM', task: 'Sample Processing', location: 'Main Lab' },
  { time: '02:00 PM', task: 'Home Visit – Patient #14', location: 'Sector 12' },
];

const ANNOUNCEMENTS = [
  { title: 'February payslip is now available', time: '2h ago', dot: '#f59e0b' },
  { title: 'Q1 Performance Review starts March 10', time: '1d ago', dot: '#6366f1' },
  { title: 'Public holiday on March 14 (Holi)', time: '2d ago', dot: '#10b981' },
];

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <View className="flex-1 bg-[#f5f4fb]">
      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <View className="absolute inset-0 z-20 flex-row">
          <View className="w-[72%] overflow-hidden rounded-r-[32px] shadow-lg">
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </View>
          <Pressable
            className="flex-1"
            onPress={() => setIsSidebarOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close menu overlay"
          />
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-6 pt-16 pb-2">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            onPress={() => setIsSidebarOpen(true)}
          >
            <View className="w-5 gap-[5px]">
              <View className="h-[2px] w-5 rounded-full bg-slate-800" />
              <View className="h-[2px] w-3 rounded-full bg-slate-800" />
              <View className="h-[2px] w-5 rounded-full bg-slate-800" />
            </View>
          </Pressable>

          <View className="flex-1 px-4">
            <Text className="text-xs text-slate-400">Mon, 3 Mar 2026</Text>
            <Text className="text-base font-semibold text-slate-800">Good Morning, Akash</Text>
          </View>

          <Pressable
            className="relative h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Feather name="bell" size={18} color="#0f2f3a" />
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />
          </Pressable>
        </View>

        {/* ── Check-in Banner ── */}
        <View className="mx-6 mt-4 rounded-2xl bg-[#0f2f3a] p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs uppercase tracking-widest text-amber-200/70">
                Today's Status
              </Text>
              <Text className="mt-1 text-xl font-bold text-white">Not Checked In</Text>
              <Text className="mt-0.5 text-sm text-white/50">Shift starts at 08:30 AM</Text>
            </View>

            <Pressable className="items-center justify-center rounded-2xl bg-amber-200 px-5 py-3">
              <Feather name="clock" size={18} color="#0f2f3a" />
              <Text className="mt-1 text-xs font-bold text-[#0f2f3a]">Check In</Text>
            </Pressable>
          </View>

          {/* Mini stats inside banner */}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-xl bg-white/10 px-3 py-2.5">
              <Text className="text-[10px] text-white/50">Attendance</Text>
              <Text className="mt-0.5 text-sm font-semibold text-white">96%</Text>
            </View>
            <View className="flex-1 rounded-xl bg-white/10 px-3 py-2.5">
              <Text className="text-[10px] text-white/50">Leave Balance</Text>
              <Text className="mt-0.5 text-sm font-semibold text-white">12 Days</Text>
            </View>
            <View className="flex-1 rounded-xl bg-white/10 px-3 py-2.5">
              <Text className="text-[10px] text-white/50">This Week</Text>
              <Text className="mt-0.5 text-sm font-semibold text-white">38.5 hrs</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text className="mx-6 mt-6 text-base font-semibold text-slate-800">Quick Actions</Text>
        <View className="mx-6 mt-3 flex-row flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={{ backgroundColor: action.bg, width: '47.5%' }}
              className="rounded-2xl p-4"
              accessibilityRole="button"
            >
              <View
                style={{ backgroundColor: action.color + '22' }}
                className="h-10 w-10 items-center justify-center rounded-full"
              >
                <Feather name={action.icon} size={18} color={action.color} />
              </View>
              <Text className="mt-3 text-sm font-semibold text-slate-800">{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Today's Duties ── */}
        <View className="mx-6 mt-6 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-slate-800">Today's Duties</Text>
          <Pressable accessibilityRole="button">
            <Text className="text-xs font-medium text-[#0f2f3a]">See All</Text>
          </Pressable>
        </View>

        <View className="mx-6 mt-3 overflow-hidden rounded-2xl bg-white">
          {DUTIES.map((duty, index) => (
            <View
              key={duty.task}
              className={`flex-row items-center px-4 py-3.5 ${
                index < DUTIES.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <View className="h-2 w-2 rounded-full bg-amber-400" />
              <Text className="ml-3 w-24 text-xs text-slate-400">{duty.time}</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-slate-800">{duty.task}</Text>
                <Text className="text-xs text-slate-400">{duty.location}</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#cbd5e1" />
            </View>
          ))}
        </View>

        {/* ── Announcements ── */}
        <View className="mx-6 mt-6 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-slate-800">Announcements</Text>
          <Pressable accessibilityRole="button">
            <Text className="text-xs font-medium text-[#0f2f3a]">See All</Text>
          </Pressable>
        </View>

        <View className="mx-6 mt-3 overflow-hidden rounded-2xl bg-white">
          {ANNOUNCEMENTS.map((item, index) => (
            <View
              key={item.title}
              className={`flex-row items-start px-4 py-3.5 ${
                index < ANNOUNCEMENTS.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <View
                style={{ backgroundColor: item.dot }}
                className="mt-1.5 h-2 w-2 rounded-full"
              />
              <View className="ml-3 flex-1">
                <Text className="text-sm text-slate-700">{item.title}</Text>
                <Text className="mt-0.5 text-xs text-slate-400">{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
