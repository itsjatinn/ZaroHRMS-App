import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import ReasonCounter from '../requests/ReasonCounter';
import { REASON_MAX_LENGTH } from '../requests/requestReason';
import type { Request } from './requestsData';

/**
 * Confirms withdrawing a leave request. The HRMS requires a cancellation
 * reason — HR reviews the withdrawal, and an approved leave that is cancelled
 * credits the balance back — so this refuses to submit without one.
 */
export default function CancelLeaveDialog({
  request,
  onKeep,
  onConfirm,
}: {
  request: Request | null;
  onKeep: () => void;
  onConfirm: (request: Request, reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [attempted, setAttempted] = useState(false);

  // Each newly opened request starts from an empty reason.
  useEffect(() => {
    setReason('');
    setAttempted(false);
  }, [request]);

  if (!request) return null;

  const submit = () => {
    setAttempted(true);
    if (!reason.trim()) return;
    onConfirm(request, reason.trim());
  };

  const missing = attempted && !reason.trim();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onKeep}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/45 px-6"
        onPress={onKeep}
      >
        <Pressable className="w-full rounded-2xl border border-[#14323F]/10 bg-white p-5">
          <Text className="text-base font-bold text-ink">Withdraw request</Text>
          <Text className="mt-1 text-[13px] text-slate-500">
            {request.type} · {request.dates}
          </Text>

          <Text className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Reason<Text className="text-red-500"> *</Text>
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Why are you withdrawing this request?"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={REASON_MAX_LENGTH}
            textAlignVertical="top"
            autoFocus
            className={`min-h-20 rounded-xl border bg-white p-3 text-sm text-ink ${
              missing ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          <ReasonCounter value={reason} />
          {missing ? (
            <Text className="mt-1 text-xs text-rose-500">
              Please provide a cancellation reason.
            </Text>
          ) : null}

          <View className="mt-4 flex-row gap-2.5">
            <Pressable
              onPress={onKeep}
              className="h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white active:opacity-70"
            >
              <Text className="text-sm font-bold text-ink">Keep it</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              className="h-11 flex-1 items-center justify-center rounded-xl bg-red-500 active:opacity-80"
            >
              <Text className="text-sm font-bold text-white">Withdraw</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
