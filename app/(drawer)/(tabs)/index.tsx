import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../../../src/components/Header';
import ProfileCompletionCard from '../../../src/components/ProfileCompletionCard';
import ClockInCard from '../../../src/components/ClockInCard';
import LeaveBalanceCard from '../../../src/components/LeaveBalanceCard';
import QuickActions from '../../../src/components/QuickActions';
import AttendanceCalendarCard from '../../../src/components/AttendanceCalendarCard';
import UpcomingHolidaysCard from '../../../src/components/UpcomingHolidaysCard';
import TeamTodayCard from '../../../src/components/TeamTodayCard';
import CelebrationsCard from '../../../src/components/CelebrationsCard';

export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#F4F3EF' }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* gap-4 keeps even 16px spacing between every card.
            Bottom padding clears the absolute (floating) tab bar (80 + inset). */}
        <View
          className="gap-4 p-4"
          style={{ paddingBottom: insets.bottom + 96 }}
        >
          <Header />
          <ProfileCompletionCard />
          <ClockInCard />

          <LeaveBalanceCard />

          <QuickActions />

          <AttendanceCalendarCard />

          <UpcomingHolidaysCard />

          {/* Team today + Celebrations sit side by side */}
          <View className="flex-row gap-4">
            <TeamTodayCard />
            <CelebrationsCard />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
