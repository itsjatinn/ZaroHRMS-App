import { Send, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { cardShadow } from '../shadow';
import {
  formatDayLabel,
  initialsFor,
  KIND_META,
  metaLineFor,
  type Celebration,
} from './celebrationsData';

const MAX_LENGTH = 240;

type WishComposerSheetProps = {
  celebration: Celebration | null;
  onSend: (celebration: Celebration, message: string) => void;
  onClose: () => void;
};

// Opened by the action button on a celebration card. Offers per-kind quick
// picks, an editable note and a send action.
export default function WishComposerSheet({
  celebration,
  onSend,
  onClose,
}: WishComposerSheetProps) {
  const [message, setMessage] = useState('');

  // Each newly opened card starts from its own kind's first quick pick.
  useEffect(() => {
    setMessage(celebration ? KIND_META[celebration.kind].suggestions[0] : '');
  }, [celebration]);

  if (!celebration) return null;

  const meta = KIND_META[celebration.kind];
  const trimmed = message.trim();
  const canSend = trimmed.length > 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
          <Pressable className="max-h-[88%] rounded-t-[28px] bg-white px-5 pb-7">
            <View className="mt-3 h-1 w-10 self-center rounded-full bg-slate-200" />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Who this is going to */}
              <View className="mt-4 flex-row items-center gap-3">
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: celebration.avatarBg ?? '#14323F' }}
                >
                  <Text className="text-sm font-bold text-white">
                    {initialsFor(celebration.name)}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[17px] font-bold text-ink" numberOfLines={1}>
                    {celebration.name}
                  </Text>
                  <Text className="text-xs text-slate-400" numberOfLines={1}>
                    {metaLineFor(celebration)} · {formatDayLabel(celebration.date)}
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:scale-95"
                >
                  <X size={17} color="#14323F" />
                </Pressable>
              </View>

              {/* Quick picks */}
              <Text className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Quick picks
              </Text>
              <View className="mt-2.5 gap-2">
                {meta.suggestions.map((suggestion) => {
                  const active = suggestion === message;
                  return (
                    <Pressable
                      key={suggestion}
                      onPress={() => setMessage(suggestion)}
                      className="rounded-2xl border px-3.5 py-3 active:scale-[0.99]"
                      style={{
                        borderColor: active ? meta.color + '66' : '#E2E8F0',
                        backgroundColor: active ? meta.bg : '#FFFFFF',
                      }}
                    >
                      <Text className="text-[13px] text-ink">{suggestion}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Editable note */}
              <Text className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Your note
              </Text>
              <View className="mt-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={`Write something to ${celebration.name.split(' ')[0]}…`}
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={MAX_LENGTH}
                  className="min-h-[76px] text-sm leading-5 text-ink"
                  textAlignVertical="top"
                />
              </View>
              <Text className="mt-1.5 self-end text-[11px] text-slate-400">
                {message.length}/{MAX_LENGTH}
              </Text>

              <Pressable
                onPress={() => onSend(celebration, trimmed)}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSend }}
                style={canSend ? cardShadow : undefined}
                className={`mt-4 h-12 flex-row items-center justify-center gap-2 rounded-2xl ${
                  canSend ? 'bg-[#14323F] active:scale-95' : 'bg-slate-200'
                }`}
              >
                <Send size={15} color={canSend ? '#FFFFFF' : '#94A3B8'} />
                <Text
                  className={`text-sm font-semibold ${
                    canSend ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  Send {meta.label.toLowerCase()} note
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
