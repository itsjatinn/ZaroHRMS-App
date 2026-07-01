import { ChevronDown, Lock } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import DocumentsCard from './DocumentsCard';
import InfoCard from './InfoCard';
import RepeatableCard from './RepeatableCard';
import {
  EDUCATION_TEMPLATE,
  EXPERIENCE_TEMPLATE,
  SECTION_CARDS,
  type ProfileSection,
} from './profileSections';

type Props = {
  section: ProfileSection;
  /** Controlled open state — only one section is open at a time (parent-owned). */
  open: boolean;
  onToggle: () => void;
  /** Hairline divider above the header (skip for the first row). */
  first?: boolean;
};

// One accordion row inside the unified profile container: a tappable header that
// reveals its field group(s) inline below. Open state is controlled by the
// parent so opening one section closes the others.
export default function SectionBlock({ section, open, onToggle, first = false }: Props) {
  const Icon = section.icon;
  const cards = SECTION_CARDS[section.key] ?? [];

  return (
    <View className={first ? '' : 'border-t border-slate-100'}>
      {/* Header row */}
      <Pressable
        onPress={onToggle}
        className="flex-row items-center gap-3 px-5 py-4 active:opacity-70"
      >
        <Icon size={19} color="#14323F" />
        <Text className="text-base font-bold text-ink">{section.label}</Text>
        {section.readOnly ? (
          <View className="ml-2 flex-row items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <Lock size={11} color="#94A3B8" />
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Locked
            </Text>
          </View>
        ) : null}
        <View className="flex-1" />
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={19} color="#94A3B8" />
        </View>
      </Pressable>

      {/* Inline content */}
      {open ? (
        <View className="gap-1 px-5 pb-4">
          {section.key === 'documents' ? (
            <DocumentsCard />
          ) : section.key === 'education' ? (
            <RepeatableCard
              entries={cards.map((c, i) => ({ id: `edu-${i}`, ...c }))}
              template={EDUCATION_TEMPLATE}
              addLabel="Add education"
            />
          ) : section.key === 'experience' ? (
            <RepeatableCard
              entries={cards.map((c, i) => ({ id: `exp-${i}`, ...c }))}
              template={EXPERIENCE_TEMPLATE}
              addLabel="Add experience"
            />
          ) : (
            cards.map((c) => (
              <InfoCard
                key={c.title}
                title={c.title}
                items={c.items}
                showTitle={cards.length > 1}
                readOnly={section.readOnly}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
