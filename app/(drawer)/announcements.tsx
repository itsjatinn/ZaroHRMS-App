import { ScrollView, Text } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import AnnouncementCard from '../../src/components/announcements/AnnouncementCard';
import { ANNOUNCEMENTS } from '../../src/components/announcements/announcementsData';

export default function Announcements() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton title="Announcements" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-slate-400">
          Latest updates and news from across the company.
        </Text>

        {ANNOUNCEMENTS.map((a) => (
          <AnnouncementCard key={a.title} item={a} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
