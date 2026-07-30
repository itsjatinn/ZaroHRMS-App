import {
  Cake,
  Hand,
  Heart,
  PartyPopper,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  BRAND_PRIMARY,
  brandAlpha,
  KIND_META,
  type Celebration,
  type CelebrationKind,
} from './celebrationsData';

// Same cap as the web composer.
const MAX_LENGTH = 200;

const KIND_ICON: Record<
  CelebrationKind,
  (color: string, size: number) => React.ReactNode
> = {
  birthday: (color, size) => <Cake size={size} color={color} />,
  anniversary: (color, size) => <PartyPopper size={size} color={color} />,
  marriageAnniversary: (color, size) => <Heart size={size} color={color} />,
  newJoiner: (color, size) => <Hand size={size} color={color} />,
};

type WishComposerSheetProps = {
  celebration: Celebration | null;
  onSend: (celebration: Celebration, message: string) => void;
  onClose: () => void;
};

// Opened by the action button on a celebration card. Mirrors the web panel's
// "Write a wish" dialog, anchored to the bottom edge as on small screens.
export default function WishComposerSheet({
  celebration,
  onSend,
  onClose,
}: WishComposerSheetProps) {
  const [message, setMessage] = useState('');

  // Every newly opened card starts from an empty draft.
  useEffect(() => {
    setMessage('');
  }, [celebration]);

  if (!celebration) return null;

  const meta = KIND_META[celebration.kind];
  const trimmed = message.trim();
  const remaining = MAX_LENGTH - message.length;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Pressable
          className="flex-1 justify-end p-3"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.28)' }}
          onPress={onClose}
        >
          <Pressable
            className="rounded-xl border bg-white p-4"
            style={{ borderColor: brandAlpha(0.12) }}
          >
            {/* Who the wish goes to + the occasion pill */}
            <View className="mb-3.5 flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text
                  className="text-base font-bold"
                  style={{ color: BRAND_PRIMARY }}
                >
                  Write a wish
                </Text>
                <Text
                  className="mt-0.5 text-[13px] font-semibold"
                  style={{ color: brandAlpha(0.58) }}
                  numberOfLines={1}
                >
                  {celebration.name}
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-[3px]"
                style={{ backgroundColor: meta.bg }}
              >
                {KIND_ICON[celebration.kind](meta.color, 13)}
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </Text>
              </View>
            </View>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor={brandAlpha(0.45)}
              multiline
              autoFocus
              maxLength={MAX_LENGTH}
              className="min-h-[140px] rounded-[10px] border p-3 text-sm leading-[21px]"
              style={{ borderColor: brandAlpha(0.14), color: BRAND_PRIMARY }}
              textAlignVertical="top"
            />

            <Text
              className="mt-3 text-xs font-semibold"
              style={{ color: brandAlpha(0.5) }}
            >
              {remaining} characters left
            </Text>
            <View className="mt-2 flex-row justify-end gap-2">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                className="rounded-lg border bg-white px-3.5 py-2 active:opacity-70"
                style={{ borderColor: brandAlpha(0.12) }}
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: BRAND_PRIMARY }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onSend(celebration, trimmed)}
                disabled={!trimmed}
                accessibilityRole="button"
                accessibilityState={{ disabled: !trimmed }}
                className={`rounded-lg px-3.5 py-2 active:opacity-70 ${
                  trimmed ? '' : 'opacity-55'
                }`}
                style={{ backgroundColor: BRAND_PRIMARY }}
              >
                <Text className="text-[13px] font-bold text-white">
                  Send wish
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
