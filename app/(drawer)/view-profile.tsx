import { LayoutAnimation, ScrollView, View } from 'react-native';
import { useState } from 'react';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import BackButton from '../../src/components/BackButton';
import { cardShadow } from '../../src/components/shadow';
import ProfileHeader from '../../src/components/profile/ProfileHeader';
import SectionBlock from '../../src/components/profile/SectionBlock';
import { PROFILE_SECTIONS } from '../../src/components/profile/profileSections';

export default function ViewProfile() {
  const insets = useSafeAreaInsets();

  // Only one section open at a time. Starts on the first section.
  const [openKey, setOpenKey] = useState<string | null>(PROFILE_SECTIONS[0]?.key ?? null);

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey((cur) => (cur === key ? null : key));
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <BackButton title="View Profile" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />

        {/* All sections in one unified accordion container */}
        <View
          style={cardShadow}
          className="overflow-hidden rounded-[24px] border border-slate-100 bg-white"
        >
          {PROFILE_SECTIONS.map((s, i) => (
            <SectionBlock
              key={s.key}
              section={s}
              open={openKey === s.key}
              onToggle={() => toggle(s.key)}
              first={i === 0}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
