import DateTimePicker, {
  type DateTimePickerEvent,
} from '../CrossDatePicker';
import { Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Alert } from '../CrossAlert';

import { cardShadow } from '../shadow';
import {
  COLLECTIONS,
  type CollectionKey,
  type CollectionRow,
  type FieldSpec,
} from './collectionFields';

/**
 * Editor for one repeatable profile collection (education, experience, family,
 * nominees, guardians, emergency contacts).
 *
 * Each save replaces the whole collection server-side, so add/edit/delete all
 * commit the full next array through `onCommit` — the screen owns which PUT
 * that maps to.
 */

/** ISO yyyy-mm-dd in local time — never toISOString, which shifts overnight. */
function isoOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function displayValue(spec: FieldSpec, value: unknown): string {
  if (spec.type === 'boolean') return value === true ? 'Yes' : 'No';
  if (spec.type === 'date') {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return '—';
    const d = new Date(text);
    return Number.isNaN(d.getTime())
      ? text
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const text = value === null || value === undefined ? '' : String(value).trim();
  return text || '—';
}

/** One labelled field inside the editor modal. */
function EditorField({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (spec.type === 'boolean') {
    return (
      <View className="mb-3">
        <Text className="mb-1.5 text-xs font-semibold text-slate-500">
          {spec.label}
        </Text>
        <View className="flex-row gap-2">
          {[true, false].map((option) => {
            const selected = (value === true) === option;
            return (
              <Pressable
                key={String(option)}
                onPress={() => onChange(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="rounded-full px-4 py-1.5"
                style={{ backgroundColor: selected ? '#14323F' : '#F1F5F9' }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: selected ? '#FFFFFF' : '#475569' }}
                >
                  {option ? 'Yes' : 'No'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (spec.type === 'date') {
    const iso = typeof value === 'string' ? value : '';
    const selected = iso ? new Date(iso) : null;
    return (
      <View className="mb-3">
        <Text className="mb-1.5 text-xs font-semibold text-slate-500">
          {spec.label}
          {spec.required ? ' *' : ''}
        </Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          className="h-11 justify-center rounded-xl border border-slate-200 bg-white px-3.5"
        >
          <Text className={iso ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
            {iso ? displayValue(spec, iso) : 'Select date'}
          </Text>
        </Pressable>
        {pickerOpen ? (
          <DateTimePicker
            value={selected && !Number.isNaN(selected.getTime()) ? selected : new Date()}
            mode="date"
            onChange={(event: DateTimePickerEvent, picked?: Date) => {
              setPickerOpen(false);
              if (event.type === 'dismissed' || !picked) return;
              onChange(isoOf(picked));
            }}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-semibold text-slate-500">
        {spec.label}
        {spec.required ? ' *' : ''}
      </Text>
      <TextInput
        value={value === null || value === undefined ? '' : String(value)}
        onChangeText={(text) =>
          onChange(spec.type === 'number' ? text.replace(/[^\d.]/g, '') : text)
        }
        placeholder={spec.placeholder ?? spec.label}
        placeholderTextColor="#94A3B8"
        keyboardType={spec.type === 'number' ? 'number-pad' : 'default'}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-ink"
      />
    </View>
  );
}

type GroupProps = {
  collection: CollectionKey;
  rows: CollectionRow[];
  /** Replaces the entire collection; rejects with the server's message. */
  onCommit: (nextRows: CollectionRow[]) => Promise<unknown>;
};

let localId = 0;

/** One collection group: heading, add button, entry cards, and the editor. */
export default function LiveCollectionGroup({
  collection,
  rows,
  onCommit,
}: GroupProps) {
  const config = COLLECTIONS[collection];
  const { width, height } = useWindowDimensions();
  // null = closed; a row with no id yet = adding.
  const [draft, setDraft] = useState<CollectionRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const editorOpen = draft !== null;
  useEffect(() => {
    // Fresh slate each time the editor opens.
    if (editorOpen) setErrors([]);
  }, [editorOpen]);

  const commit = async (nextRows: CollectionRow[]) => {
    setSaving(true);
    try {
      await onCommit(nextRows);
      setDraft(null);
      setEditingId(null);
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error && error.message
          ? error.message
          : 'Please try again in a moment.',
      );
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!draft) return;
    const blockers = config.validate(draft);
    if (blockers.length) {
      setErrors(blockers);
      return;
    }
    const next = editingId
      ? rows.map((row) => (row.id === editingId ? draft : row))
      : [...rows, draft];
    void commit(next);
  };

  const remove = (row: CollectionRow) => {
    Alert.alert(
      `Remove this ${config.noun}?`,
      config.rowTitle(row),
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void commit(rows.filter((r) => r.id !== row.id)),
        },
      ],
    );
  };

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center">
        <Text className="flex-1 text-sm font-bold text-ink">{config.title}</Text>
        <Pressable
          onPress={() => {
            setEditingId(null);
            setDraft({ id: `new-${localId++}` });
          }}
          accessibilityRole="button"
          accessibilityLabel={config.addLabel}
          className="flex-row items-center gap-1 rounded-full bg-ink px-3 py-1.5 active:scale-95"
        >
          <Plus size={12} color="#FFFFFF" />
          <Text className="text-[11px] font-bold text-white">Add</Text>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text className="py-4 text-center text-xs text-slate-400">
          Nothing added yet.
        </Text>
      ) : (
        rows.map((row) => (
          <View key={row.id} className="mb-2 rounded-2xl bg-slate-50 p-3">
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-sm font-bold text-ink" numberOfLines={1}>
                {config.rowTitle(row)}
              </Text>
              <Pressable
                onPress={() => {
                  setEditingId(row.id ?? null);
                  setDraft({ ...row });
                }}
                hitSlop={8}
                accessibilityLabel={`Edit ${config.rowTitle(row)}`}
                className="h-7 w-7 items-center justify-center rounded-full bg-white active:scale-95"
              >
                <Pencil size={13} color="#334155" />
              </Pressable>
              <Pressable
                onPress={() => remove(row)}
                hitSlop={8}
                accessibilityLabel={`Remove ${config.rowTitle(row)}`}
                className="h-7 w-7 items-center justify-center rounded-full bg-white active:scale-95"
              >
                <Trash2 size={13} color="#E11D48" />
              </Pressable>
            </View>

            {/* Compact three-column field grid — one row per field wasted a
                whole card line on every value. */}
            <View className="mt-2 flex-row flex-wrap">
              {config.fields.map((spec) => (
                  <View key={spec.key} className="w-1/3 pb-2 pr-2">
                    <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {spec.label}
                    </Text>
                    <Text className="text-xs font-semibold text-ink">
                      {displayValue(spec, row[spec.key])}
                    </Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      {/* Editor modal — centred card, like every other modal in the app. */}
      <Modal
        visible={draft !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDraft(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View
            style={[cardShadow, { width: Math.min(width * 0.92, 440), maxHeight: height * 0.82 }]}
            className="overflow-hidden rounded-[24px] bg-white"
          >
            <View className="flex-row items-center gap-3 border-b border-slate-100 px-5 py-3.5">
              <Text className="flex-1 text-base font-bold text-ink">
                {editingId ? `Edit ${config.noun}` : config.addLabel}
              </Text>
              <Pressable
                onPress={() => setDraft(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:scale-95"
              >
                <X size={16} color="#334155" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerClassName="px-5 pt-4"
              keyboardShouldPersistTaps="handled"
            >
              {draft
                ? config.fields.map((spec) => (
                    <EditorField
                      key={spec.key}
                      spec={spec}
                      value={draft[spec.key]}
                      onChange={(next) =>
                        setDraft((current) =>
                          current ? { ...current, [spec.key]: next } : current,
                        )
                      }
                    />
                  ))
                : null}

              {errors.length ? (
                <View className="mb-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5">
                  {errors.map((message) => (
                    <Text key={message} className="text-xs font-medium text-red-700">
                      {message}
                    </Text>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            <View className="flex-row gap-3 px-5 py-4">
              <Pressable
                onPress={() => setDraft(null)}
                disabled={saving}
                accessibilityRole="button"
                className="flex-1 items-center justify-center rounded-2xl border border-slate-200 py-3 active:bg-slate-50"
              >
                <Text className="text-sm font-bold text-ink">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                accessibilityRole="button"
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-ink py-3 active:scale-95"
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text className="text-sm font-bold text-white">
                  {saving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
