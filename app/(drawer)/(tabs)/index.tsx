import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../../src/components/Header';
import ClockInCard from '../../../src/components/ClockInCard';
import LeaveBalanceCard from '../../../src/components/LeaveBalanceCard';
import PaydayCard from '../../../src/components/PaydayCard';
import QuickActions from '../../../src/components/QuickActions';
import TeamTodayCard from '../../../src/components/TeamTodayCard';
import CelebrationsCard from '../../../src/components/CelebrationsCard';

export default function Index() {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#F4F3EF' }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* gap-4 keeps even 16px spacing between every card */}
        <View className="gap-4 p-4 pb-8">
          <Header />
          <ClockInCard />

          {/* Leave balance + Payday sit side by side */}
          <View className="flex-row gap-4">
            <LeaveBalanceCard />
            <PaydayCard />
          </View>

          <QuickActions />

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
