import { ScrollView } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import ProfileHeader from '../../src/components/profile/ProfileHeader';
import SectionBlock from '../../src/components/profile/SectionBlock';
import { PROFILE_SECTIONS } from '../../src/components/profile/profileSections';

export default function ViewProfile() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton title="View Profile" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />

        {/* Each section is its own collapsible card (Overview open) */}
        {PROFILE_SECTIONS.map((s, i) => (
          <SectionBlock key={s.key} section={s} defaultOpen={i === 0} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
