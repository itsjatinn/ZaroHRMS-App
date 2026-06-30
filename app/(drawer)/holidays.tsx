import { CalendarHeart, Sparkles } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import FeaturedHolidayCard from '../../src/components/holidays/FeaturedHolidayCard';
import HolidayListCard from '../../src/components/holidays/HolidayListCard';
import { cardShadow } from '../../src/components/shadow';

export default function Holidays() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton title="Holidays" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary stats */}
        <View className="flex-row gap-3">
          <View style={cardShadow} className="flex-1 rounded-2xl bg-white p-4">
            <CalendarHeart size={18} color="#E0785C" />
            <Text className="mt-2 text-2xl font-bold text-ink">12</Text>
            <Text className="text-xs text-slate-400">Total holidays</Text>
          </View>
          <View style={cardShadow} className="flex-1 rounded-2xl bg-white p-4">
            <Sparkles size={18} color="#D9A53B" />
            <Text className="mt-2 text-2xl font-bold text-ink">8</Text>
            <Text className="text-xs text-slate-400">Upcoming</Text>
          </View>
        </View>

        <FeaturedHolidayCard />
        <HolidayListCard />
      </ScrollView>
    </SafeAreaView>
  );
}
