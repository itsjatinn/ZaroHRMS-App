import { ChevronDown, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cardShadow } from '../shadow';
import InfoCard from './InfoCard';
import { SECTION_CARDS, type ProfileSection } from './profileSections';

type Props = {
  section: ProfileSection;
  defaultOpen?: boolean;
};

// One collapsible profile section: a tappable title header that reveals its
// info cards (or a locked placeholder for gated sections).
export default function SectionBlock({ section, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;
  const cards = SECTION_CARDS[section.key] ?? [];

  return (
    <View className="gap-3">
      {/* Section header (toggles open/closed) */}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-2 px-1 active:opacity-70"
      >
        <Icon size={18} color="#14323F" />
        <Text className="flex-1 text-base font-bold text-ink">{section.label}</Text>
        {section.locked && (
          <View className="h-6 w-6 items-center justify-center rounded-full bg-[#F5D14E]">
            <Lock size={12} color="#14323F" />
          </View>
        )}
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={18} color="#94A3B8" />
        </View>
      </Pressable>

      {/* Content (only when expanded) */}
      {open &&
        (section.locked ? (
          <View style={cardShadow} className="items-center rounded-2xl bg-white px-6 py-8">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#F5D14E]">
              <Lock size={22} color="#14323F" />
            </View>
            <Text className="mt-3 text-sm font-semibold text-ink">Locked</Text>
            <Text className="mt-0.5 text-center text-xs text-slate-400">
              Verify your identity or contact HR to view this section.
            </Text>
          </View>
        ) : (
          cards.map((c) => <InfoCard key={c.title} title={c.title} items={c.items} />)
        ))}
    </View>
  );
}
