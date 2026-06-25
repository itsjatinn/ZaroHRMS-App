import { CalendarCheck, CalendarDays, CircleX, Clock } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import AttendanceCalendarCard from '../../../src/components/AttendanceCalendarCard';
import BackButton from '../../../src/components/BackButton';
import AttendanceLog from '../../../src/components/attendance/AttendanceLog';
import TodayCard from '../../../src/components/attendance/TodayCard';
import StatCard from '../../../src/components/leave/StatCard';

// This month's attendance summary.
const STATS = [
  { label: 'Present', value: 18, icon: CalendarCheck, color: '#059669', badge: 'bg-emerald-100' },
  { label: 'Absent', value: 2, icon: CircleX, color: '#E11D48', badge: 'bg-rose-100' },
  { label: 'Late', value: 3, icon: Clock, color: '#D9A53B', badge: 'bg-amber-100' },
  { label: 'Leave', value: 1, icon: CalendarDays, color: '#2563EB', badge: 'bg-blue-100' },
];

export default function Attendance() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-6"
        // Clear the floating tab bar at the bottom.
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <Text className="text-xl font-bold text-ink">Attendance</Text>
          <Text className="mt-1 text-sm text-slate-400">
            Track your daily attendance and work hours.
          </Text>
        </View>

        {/* Today's attendance */}
        <TodayCard />

        {/* This month summary */}
        <View>
          <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            This month
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {STATS.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                iconColor={s.color}
                badgeClass={s.badge}
                className="w-[48%]"
              />
            ))}
          </View>
        </View>

        {/* Monthly calendar with attendance markers */}
        <AttendanceCalendarCard />

        {/* Recent activity log */}
        <AttendanceLog />
      </ScrollView>
    </SafeAreaView>
  );
}
