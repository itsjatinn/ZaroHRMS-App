import DateTimePicker, { type DateTimePickerEvent } from '../CrossDatePicker';
import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { cardShadow } from '../shadow';
import {
  DELEGATE_OPTIONS,
  DELEGATION_STATE_STYLE,
  type Delegation,
} from './approvalsData';

const formatDate = (date: Date) =>
  `${`${date.getDate()}`.padStart(2, '0')}/${`${date.getMonth() + 1}`.padStart(2, '0')}/${date.getFullYear()}`;

function FieldLabel({ children }: { children: string }) {
  return <Text className="mb-1.5 text-xs font-semibold text-slate-500">{children}</Text>;
}

export default function DelegateApprovalsModal({
  visible,
  delegations,
  onClose,
  onDelegate,
  onRevoke,
}: {
  visible: boolean;
  delegations: Delegation[];
  onClose: () => void;
  onDelegate: (delegation: Omit<Delegation, 'id' | 'state'>) => void;
  onRevoke: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [delegate, setDelegate] = useState<string | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [attempted, setAttempted] = useState(false);

  const matches = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search || delegate) return [];
    return DELEGATE_OPTIONS.filter((option) =>
      `${option.name} ${option.employeeId} ${option.email}`.toLowerCase().includes(search),
    ).slice(0, 4);
  }, [query, delegate]);

  const reset = () => {
    setQuery('');
    setDelegate(null);
    setStart(null);
    setEnd(null);
    setReason('');
    setAttempted(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handlePicked = (event: DateTimePickerEvent, date?: Date) => {
    const which = picker;
    setPicker(null);
    if (event.type === 'dismissed' || !date) return;
    if (which === 'start') {
      setStart(date);
      // Keep the range coherent — an end before the start is never valid.
      if (end && date > end) setEnd(null);
    } else {
      setEnd(date);
    }
  };

  const submit = () => {
    setAttempted(true);
    if (!delegate || !start || !end) return;
    onDelegate({
      delegate,
      start: formatDate(start),
      end: formatDate(end),
      reason: reason.trim() || undefined,
    });
    reset();
  };

  const missing = (value: unknown) => attempted && !value;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-end bg-black/45">
        <View className="max-h-[88%] rounded-t-[28px] bg-white pb-6">
          <View className="flex-row items-start gap-3 px-5 pb-3 pt-5">
            <View className="flex-1">
              <Text className="text-lg font-bold text-ink">Delegate approvals</Text>
              <Text className="mt-1 text-xs leading-4 text-slate-400">
                Hand your approval queue to a colleague while you are out of office. Items they
                action show up as decided on your behalf.
              </Text>
            </View>
            <Pressable onPress={close} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:opacity-70">
              <Feather name="x" size={16} color="#14323F" />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="px-5">
            {delegations.length ? (
              <View className="mb-5">
                <Text className="mb-2 text-sm font-bold text-ink">Existing delegations</Text>
                <View className="gap-2">
                  {delegations.map((item) => {
                    const style = DELEGATION_STATE_STYLE[item.state];
                    return (
                      <View key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3" style={cardShadow}>
                        <View className="flex-row items-center">
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-ink">To {item.delegate}</Text>
                            <Text className="mt-0.5 text-[11px] text-slate-400">
                              {item.start} to {item.end}
                            </Text>
                          </View>
                          <Text className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: style.bg, color: style.text }}>
                            {item.state}
                          </Text>
                        </View>
                        {item.state !== 'Revoked' ? (
                          <Pressable onPress={() => onRevoke(item.id)} className="mt-2 self-start rounded-lg border border-rose-200 px-3 py-1.5 active:opacity-70">
                            <Text className="text-[11px] font-bold text-rose-500">Revoke</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <Text className="mb-2 text-sm font-bold text-ink">New delegation</Text>

            <View className="mb-3">
              <FieldLabel>Delegate</FieldLabel>
              {delegate ? (
                <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Feather name="user-check" size={15} color="#3D8762" />
                  <Text className="ml-2 flex-1 text-sm font-semibold text-ink">{delegate}</Text>
                  <Pressable onPress={() => { setDelegate(null); setQuery(''); }} hitSlop={8}>
                    <Feather name="x" size={15} color="#94A3B8" />
                  </Pressable>
                </View>
              ) : (
                <View className={`flex-row items-center rounded-xl border bg-white px-3 ${missing(delegate) ? 'border-rose-300' : 'border-slate-200'}`}>
                  <Feather name="search" size={16} color="#94A3B8" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search colleague by name, code, or email…"
                    placeholderTextColor="#94A3B8"
                    className="ml-2 h-12 flex-1 text-sm text-ink"
                  />
                </View>
              )}
              {matches.length ? (
                <View className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white" style={cardShadow}>
                  {matches.map((option) => (
                    <Pressable
                      key={option.employeeId}
                      onPress={() => { setDelegate(option.name); setQuery(''); }}
                      className="border-b border-slate-100 px-3 py-2.5 active:bg-slate-50"
                    >
                      <Text className="text-sm font-semibold text-ink">{option.name}</Text>
                      <Text className="text-[11px] text-slate-400">{option.employeeId} · {option.email}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View className="mb-3 flex-row gap-3">
              <View className="flex-1">
                <FieldLabel>Start date</FieldLabel>
                <Pressable
                  onPress={() => setPicker('start')}
                  className={`flex-row items-center justify-between rounded-xl border bg-white px-3 py-3.5 active:opacity-70 ${missing(start) ? 'border-rose-300' : 'border-slate-200'}`}
                >
                  <Text className={`text-sm ${start ? 'text-ink' : 'text-slate-400'}`}>
                    {start ? formatDate(start) : 'DD/MM/YYYY'}
                  </Text>
                  <Feather name="calendar" size={15} color="#94A3B8" />
                </Pressable>
              </View>
              <View className="flex-1">
                <FieldLabel>End date</FieldLabel>
                <Pressable
                  onPress={() => setPicker('end')}
                  className={`flex-row items-center justify-between rounded-xl border bg-white px-3 py-3.5 active:opacity-70 ${missing(end) ? 'border-rose-300' : 'border-slate-200'}`}
                >
                  <Text className={`text-sm ${end ? 'text-ink' : 'text-slate-400'}`}>
                    {end ? formatDate(end) : 'DD/MM/YYYY'}
                  </Text>
                  <Feather name="calendar" size={15} color="#94A3B8" />
                </Pressable>
              </View>
            </View>

            <View className="mb-2">
              <FieldLabel>Reason (optional)</FieldLabel>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Annual leave"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-sm text-ink"
              />
            </View>

            {attempted && (!delegate || !start || !end) ? (
              <Text className="mb-2 text-[11px] font-semibold text-rose-500">
                Pick a delegate and both dates to continue.
              </Text>
            ) : null}
          </ScrollView>

          <View className="flex-row gap-3 px-5 pt-4">
            <Pressable onPress={close} className="flex-1 items-center rounded-xl border border-slate-200 bg-white py-3 active:opacity-70">
              <Text className="text-sm font-bold text-slate-500">Close</Text>
            </Pressable>
            <Pressable onPress={submit} className="flex-1 items-center rounded-xl bg-ink py-3 active:opacity-80">
              <Text className="text-sm font-bold text-white">Delegate</Text>
            </Pressable>
          </View>

          {picker ? (
            <DateTimePicker
              value={(picker === 'start' ? start : end) ?? new Date()}
              mode="date"
              minimumDate={picker === 'end' && start ? start : undefined}
              onChange={handlePicked}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
