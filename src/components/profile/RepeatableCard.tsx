import { Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, TextInput, View } from 'react-native';

import InfoCard from './InfoCard';
import type { InfoItem } from './profileData';

export type Entry = { id: string; title: string; items: InfoItem[] };

type Props = {
  /** Initial entries (each becomes an editable group). */
  entries: Entry[];
  /** Fresh field template for a newly-added entry. */
  template: { title: string; items: InfoItem[] };
  /** Label for the add button, e.g. "Add education". */
  addLabel: string;
};

let uid = 0;
const nextId = () => `e${uid++}`;

// A section of repeatable entries (education, experience): each entry has an
// editable title, inline-editable fields, and a delete action. An "Add" button
// appends a fresh blank entry. All changes are local state.
export default function RepeatableCard({ entries, template, addLabel }: Props) {
  const [list, setList] = useState<Entry[]>(() =>
    entries.map((e) => ({ ...e, id: e.id || nextId() })),
  );
  const [titleEditing, setTitleEditing] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const add = () => {
    animate();
    setList((prev) => [
      ...prev,
      {
        id: nextId(),
        title: template.title,
        items: template.items.map((it) => ({ ...it })),
      },
    ]);
  };

  const remove = (id: string) => {
    animate();
    setList((prev) => prev.filter((e) => e.id !== id));
  };

  const saveTitle = (id: string) => {
    const next = titleDraft.trim();
    if (next) setList((prev) => prev.map((e) => (e.id === id ? { ...e, title: next } : e)));
    setTitleEditing(null);
  };

  return (
    <View className="gap-3">
      {list.map((entry) => (
        <View key={entry.id} className="rounded-2xl bg-slate-50 p-3">
          {/* Entry title (editable) + delete */}
          <View className="mb-1 flex-row items-center gap-2">
            {titleEditing === entry.id ? (
              <TextInput
                value={titleDraft}
                onChangeText={setTitleDraft}
                autoFocus
                onSubmitEditing={() => saveTitle(entry.id)}
                onBlur={() => saveTitle(entry.id)}
                returnKeyType="done"
                placeholder="Title"
                placeholderTextColor="#94A3B8"
                className="flex-1 border-b border-[#F5D14E] pb-0.5 text-sm font-bold text-ink"
              />
            ) : (
              <Pressable
                className="flex-1"
                onPress={() => {
                  setTitleDraft(entry.title);
                  setTitleEditing(entry.id);
                }}
              >
                <Text className="text-sm font-bold text-ink">{entry.title}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => remove(entry.id)}
              hitSlop={8}
              accessibilityLabel="Remove entry"
              className="h-7 w-7 items-center justify-center rounded-full bg-white active:scale-95"
            >
              <Trash2 size={14} color="#E11D48" />
            </Pressable>
          </View>

          {/* Fields */}
          <InfoCard title={entry.title} items={entry.items} showTitle={false} />
        </View>
      ))}

      {/* Add button */}
      <Pressable
        onPress={add}
        className="flex-row items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 py-3 active:bg-slate-50"
      >
        <Plus size={16} color="#14323F" />
        <Text className="text-sm font-bold text-ink">{addLabel}</Text>
      </Pressable>
    </View>
  );
}
