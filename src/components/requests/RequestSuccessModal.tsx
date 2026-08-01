import { Check } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { cardShadow } from '../shadow';

/**
 * Confirmation shown after a request is accepted by the server — shared by the
 * apply-leave, regularize and WFH/OD screens so all three read alike.
 *
 * It only ever appears on a real 2xx: the previous screens showed a success
 * alert unconditionally, which claimed a submission that never happened.
 */

export type SuccessDetail = { label: string; value: string };

type Props = {
  visible: boolean;
  title: string;
  /** One line under the title, e.g. "Sent to your manager for approval." */
  message: string;
  /** Key facts about what was submitted — blank values are dropped. */
  details?: SuccessDetail[];
  /** Label for the primary button. Defaults to "Done". */
  actionLabel?: string;
  onClose: () => void;
};

export default function RequestSuccessModal({
  visible,
  title,
  message,
  details = [],
  actionLabel = 'Done',
  onClose,
}: Props) {
  const { width } = useWindowDimensions();
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      pop.setValue(0);
      return;
    }
    // A brief spring on the tick — enough to register as confirmation without
    // delaying the read.
    Animated.timing(pop, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, pop]);

  const shown = details.filter(
    (detail) => detail.value && detail.value.trim() && detail.value !== '—',
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-5">
        <View
          style={[cardShadow, { width: Math.min(width * 0.9, 420) }]}
          className="overflow-hidden rounded-[26px] bg-white"
        >
          <View className="items-center px-6 pt-7">
            <Animated.View
              style={{
                transform: [
                  {
                    scale: pop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1],
                    }),
                  },
                ],
                opacity: pop,
              }}
              className="h-16 w-16 items-center justify-center rounded-full bg-emerald-50"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
                <Check size={24} color="#FFFFFF" strokeWidth={3} />
              </View>
            </Animated.View>

            <Text className="mt-4 text-center text-lg font-bold text-ink">
              {title}
            </Text>
            <Text className="mt-1.5 text-center text-sm leading-5 text-slate-500">
              {message}
            </Text>
          </View>

          {shown.length ? (
            <View className="mx-6 mt-5 rounded-2xl bg-slate-50 px-4 py-1">
              {shown.map((detail, index) => (
                <View
                  key={detail.label}
                  className={`flex-row items-center justify-between gap-3 py-2.5 ${index > 0 ? 'border-t border-slate-200/70' : ''}`}
                >
                  <Text className="text-xs font-medium text-slate-500">
                    {detail.label}
                  </Text>
                  <Text
                    className="flex-1 text-right text-xs font-bold text-ink"
                    numberOfLines={2}
                  >
                    {detail.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="px-6 pb-6 pt-5">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="items-center justify-center rounded-2xl bg-ink py-3.5 active:scale-95"
            >
              <Text className="text-sm font-bold text-white">{actionLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
