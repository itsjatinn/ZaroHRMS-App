import { ChevronDown, Lock } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import LiveCollectionGroup from './CollectionEditor';
import type {
  CollectionKey,
  CollectionRow,
} from './collectionFields';
import DocumentsCard from './DocumentsCard';
import InfoCard from './InfoCard';
import LiveDocumentsCard from './LiveDocumentsCard';
import RepeatableCard from './RepeatableCard';
import type { InfoItem } from './profileData';
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
  /** Live cards for this section — the demo templates render when absent. */
  cards?: { title: string; items: InfoItem[] }[];
  /** Fired when an editable row saves. */
  onCommit?: (item: InfoItem, value: string) => void;
  /** True on a real HRMS session: read from the API, never from the samples. */
  live?: boolean;
  /**
   * Editable repeatable collections for this section (live only). When set,
   * these render instead of the read-only cards — add/edit/delete included.
   */
  collections?: {
    key: CollectionKey;
    rows: CollectionRow[];
    onCommit: (nextRows: CollectionRow[]) => Promise<unknown>;
  }[];
  /** Shown above the experience list, e.g. "3.4 yrs". */
  headline?: { label: string; value: string } | null;
};

/** What an empty live section says, per the web's own empty labels. */
const EMPTY_LABEL: Record<string, string> = {
  education: 'No education entries',
  experience: 'No previous experience entries',
  training: 'No training records yet',
  'family-nominees': 'No family or nominee details yet',
  compensation: 'No compensation details available',
};

// One accordion row inside the unified profile container: a tappable header that
// reveals its field group(s) inline below. Open state is controlled by the
// parent so opening one section closes the others.
export default function SectionBlock({
  section,
  open,
  onToggle,
  first = false,
  cards: liveCards,
  onCommit,
  live = false,
  headline = null,
  collections,
}: Props) {
  const Icon = section.icon;
  const cards = liveCards ?? SECTION_CARDS[section.key] ?? [];

  const body = () => {
    if (section.key === 'documents') {
      return live ? <LiveDocumentsCard /> : <DocumentsCard />;
    }

    // Live editable collections take over the whole section body.
    if (live && collections?.length) {
      return collections.map((group) => (
        <LiveCollectionGroup
          key={group.key}
          collection={group.key}
          rows={group.rows}
          onCommit={group.onCommit}
        />
      ));
    }

    if (!cards.length) {
      return (
        <Text className="py-6 text-center text-sm text-slate-400">
          {EMPTY_LABEL[section.key] ?? 'Nothing here yet'}
        </Text>
      );
    }

    // The repeatable editors keep their rows in local state only, so they are
    // demo-only. On a live session the entries render as plain read-only cards
    // rather than offering an Add button that would silently discard the row.
    if (!live && (section.key === 'education' || section.key === 'experience')) {
      return (
        <RepeatableCard
          entries={cards.map((c, i) => ({ id: `${section.key}-${i}`, ...c }))}
          template={
            section.key === 'education' ? EDUCATION_TEMPLATE : EXPERIENCE_TEMPLATE
          }
          addLabel={
            section.key === 'education' ? 'Add education' : 'Add experience'
          }
        />
      );
    }

    return cards.map((c, index) => (
      <InfoCard
        key={`${c.title}-${index}`}
        title={c.title}
        items={c.items}
        showTitle={cards.length > 1}
        readOnly={section.readOnly}
        onCommit={onCommit}
      />
    ));
  };

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
          {headline ? (
            <View className="mb-2 flex-row items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
              <Text className="text-xs font-semibold text-slate-500">
                {headline.label}
              </Text>
              <Text className="text-sm font-bold text-ink">{headline.value}</Text>
            </View>
          ) : null}
          {body()}
        </View>
      ) : null}
    </View>
  );
}
