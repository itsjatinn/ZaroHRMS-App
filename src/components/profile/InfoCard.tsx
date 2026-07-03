import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Check, Lock, Pencil, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { InfoItem } from './profileData';

type Props = {
  title: string;
  items: InfoItem[];
  /** Hide the sub-title (single-group sections don't need it). */
  showTitle?: boolean;
  /** Read-only (HR-owned) — no edit controls, shows a lock instead. */
  readOnly?: boolean;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "14 Aug 1996" -> Date (falls back to today if unparseable).
function parseDate(value: string): Date {
  const m = value.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTHS.findIndex((mm) => m[2].toLowerCase().startsWith(mm.toLowerCase()));
    const year = parseInt(m[3], 10);
    if (mon >= 0) return new Date(year, mon, day);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date(2000, 0, 1) : d;
}

// Date -> "14 Aug 1996"
function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// A group of editable label/value rows rendered plainly (no card chrome). Each
// row edits inline with the right control for its type: text input, dropdown
// (select), or the native date picker (date). Edits are local state.
export default function InfoCard({ title, items, showTitle = true, readOnly = false }: Props) {
  const [values, setValues] = useState<string[]>(() => items.map((i) => i.value));
  const [editing, setEditing] = useState<number | null>(null); // text-editing row
  const [draft, setDraft] = useState('');
  const [selectRow, setSelectRow] = useState<number | null>(null); // dropdown open
  const [dateRow, setDateRow] = useState<number | null>(null); // date picker open

  const commit = (index: number, next: string) => {
    setValues((prev) => prev.map((v, i) => (i === index ? next : v)));
  };

  // --- text ---
  const startText = (index: number) => {
    setDraft(values[index]);
    setEditing(index);
  };
  const saveText = (index: number) => {
    const next = draft.trim();
    if (next) commit(index, next);
    setEditing(null);
  };

  // --- date ---
  const onDateChange = (index: number) => (e: DateTimePickerEvent, d?: Date) => {
    // Android fires once and closes; iOS updates live (we close on confirm).
    if (Platform.OS === 'android') setDateRow(null);
    if (e.type === 'set' && d) commit(index, formatDate(d));
  };

  const openEditor = (index: number, item: InfoItem) => {
    if (item.type === 'select') setSelectRow(index);
    else if (item.type === 'date') setDateRow(index);
    else startText(index);
  };

  return (
    <View>
      {showTitle ? (
        <Text className="mb-1 mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </Text>
      ) : null}

      {items.map((item, i) => {
        const Icon = item.icon;
        const isText = editing === i;
        return (
          <View
            key={item.label}
            className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <Icon size={17} color="#64748B" />
            </View>

            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-wide text-slate-400">
                {item.label}
              </Text>

              {isText ? (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  autoFocus
                  onSubmitEditing={() => saveText(i)}
                  returnKeyType="done"
                  placeholder={item.label}
                  placeholderTextColor="#94A3B8"
                  className="mt-0.5 border-b border-[#F5D14E] pb-0.5 text-sm font-semibold text-ink"
                />
              ) : (
                <Text className="text-sm font-semibold text-ink">{values[i]}</Text>
              )}
            </View>

            {/* Row action */}
            {readOnly ? (
              // HR-owned field: no editing, just a subtle lock.
              <View className="h-8 w-8 items-center justify-center">
                <Lock size={14} color="#CBD5E1" />
              </View>
            ) : isText ? (
              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={() => saveText(i)}
                  hitSlop={8}
                  accessibilityLabel="Save"
                  className="h-8 w-8 items-center justify-center rounded-full bg-[#F5D14E] active:scale-95"
                >
                  <Check size={16} color="#14323F" />
                </Pressable>
                <Pressable
                  onPress={() => setEditing(null)}
                  hitSlop={8}
                  accessibilityLabel="Cancel"
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:scale-95"
                >
                  <X size={16} color="#64748B" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => openEditor(i, item)}
                hitSlop={8}
                accessibilityLabel={`Edit ${item.label}`}
                className="h-8 w-8 items-center justify-center rounded-full active:bg-slate-100"
              >
                <Pencil size={15} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        );
      })}

      {/* Dropdown sheet for the active 'select' row */}
      <Modal
        visible={selectRow !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectRow(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setSelectRow(null)}
        >
          <Pressable className="rounded-t-[28px] bg-white px-5 pb-8 pt-5">
            {selectRow !== null ? (
              <>
                <View className="mb-2 h-1 w-10 self-center rounded-full bg-slate-200" />
                <Text className="mb-3 text-base font-bold text-ink">
                  {items[selectRow].label}
                </Text>
                {(items[selectRow].options ?? []).map((opt) => {
                  const active = values[selectRow] === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        commit(selectRow, opt);
                        setSelectRow(null);
                      }}
                      className={`flex-row items-center justify-between rounded-2xl px-4 py-3.5 ${
                        active ? 'bg-[#F5D14E]/15' : 'active:bg-slate-50'
                      }`}
                    >
                      <Text className={`text-[15px] ${active ? 'font-bold text-ink' : 'text-slate-700'}`}>
                        {opt}
                      </Text>
                      {active ? <Check size={18} color="#14323F" /> : null}
                    </Pressable>
                  );
                })}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Native date picker for the active 'date' row */}
      {dateRow !== null ? (
        Platform.OS === 'ios' ? (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setDateRow(null)}
          >
            <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setDateRow(null)}>
              <Pressable className="rounded-t-[28px] bg-white px-4 pb-8 pt-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-base font-bold text-ink">{items[dateRow].label}</Text>
                  <Pressable
                    onPress={() => setDateRow(null)}
                    className="rounded-full bg-[#F5D14E] px-4 py-1.5"
                  >
                    <Text className="text-sm font-bold text-ink">Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={parseDate(values[dateRow])}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={onDateChange(dateRow)}
                />
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={parseDate(values[dateRow])}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onDateChange(dateRow)}
          />
        )
      ) : null}
    </View>
  );
}
