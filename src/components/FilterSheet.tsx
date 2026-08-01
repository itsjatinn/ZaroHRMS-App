import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#14323F';
const GOLD = '#F5D14E';

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number | null;
  icon?: (color: string) => ReactNode;
};

export function FilterIconButton({
  onPress,
  label = 'Open filters',
}: {
  onPress: (event: GestureResponderEvent) => void;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center active:scale-95"
    >
      <Feather name="sliders" size={20} color={INK} />
    </Pressable>
  );
}

export default function FilterSheet<T extends string>({
  visible,
  title = 'Filter',
  value,
  options,
  sections,
  onChange,
  onClose,
}: {
  visible: boolean;
  title?: string;
  value: T;
  options?: FilterOption<T>[];
  sections?: {
    title: string;
    value: string;
    options: FilterOption<string>[];
    onChange: (value: string) => void;
  }[];
  onChange?: (value: T) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 240,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [slide, visible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!visible) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousOverscroll = body.style.overscrollBehavior;
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      body.style.overflow = previousOverflow;
      body.style.overscrollBehavior = previousOverscroll;
    };
  }, [visible]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [360, 0],
  });
  const opacity = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View
          style={{
            opacity,
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.38)',
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY }],
            paddingBottom: insets.bottom + 14,
            marginHorizontal: 14,
          }}
        >
          <View className="gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-5">
            <View className="min-h-10 flex-row items-start">
              <View className="min-w-0 flex-1 pr-12">
                <Text className="text-left text-lg font-bold text-ink">{title}</Text>
                <View className="mt-2 h-1 w-12 rounded-full bg-gold" />
              </View>
              <View className="absolute right-0">
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  className="h-9 w-9 items-center justify-center"
                >
                  <Feather name="x" size={22} color={INK} />
                </Pressable>
              </View>
            </View>

            {(sections ?? [{ title: '', value, options: options ?? [], onChange: onChange as (next: string) => void }]).map((section) => (
              <View key={section.title || 'default'}>
                {section.title ? (
                  <Text className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </Text>
                ) : null}
                <View className="flex-row flex-wrap gap-2">
                  {section.options.map((option) => {
                    const active = option.value === section.value;
                    const color = active ? INK : '#64748B';
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          section.onChange(option.value);
                          if (!sections) onClose();
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        className="min-h-10 flex-row items-center rounded-xl border px-3"
                        style={{
                          borderColor: active ? GOLD : '#E2E8F0',
                          backgroundColor: active ? '#FFF8DB' : '#FFFFFF',
                        }}
                      >
                        {option.icon ? (
                          <View className="mr-2 w-5 items-center">
                            {option.icon(color)}
                          </View>
                        ) : null}
                        <Text className="text-sm font-semibold" style={{ color }}>
                          {option.label}
                          {option.count ? ` · ${option.count}` : ''}
                        </Text>
                        {active ? (
                          <Feather
                            name="check"
                            size={16}
                            color={INK}
                            style={{ marginLeft: 8 }}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
