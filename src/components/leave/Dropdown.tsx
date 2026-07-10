import { Check, ChevronDown } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from 'react-native';

type DropdownProps = {
  value: string | null;
  placeholder: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  error?: boolean;
  className?: string;
};

const OPTION_HEIGHT = 48;
const MENU_PADDING = 12;

// Lightweight select that overlays downward from the tapped field.
export default function Dropdown({
  value,
  placeholder,
  options,
  onSelect,
  error = false,
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const slideProgress = useRef(new Animated.Value(0)).current;
  const menuHeight = options.length * OPTION_HEIGHT + MENU_PADDING;

  useEffect(() => {
    if (!open) return;

    slideProgress.setValue(0);
    Animated.timing(slideProgress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [open, slideProgress]);

  const toggleMenu = () => {
    if (open) {
      closeMenu();
      return;
    }

    setOpen(true);
  };

  const closeMenu = () => {
    Animated.timing(slideProgress, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setOpen(false));
  };

  const menuStyle = {
    height: slideProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, menuHeight],
    }),
    opacity: slideProgress,
  };

  return (
    <View
      style={open ? { zIndex: 1000, elevation: 1000 } : undefined}
      className={`relative ${className}`}
    >
      <Pressable
        onPress={toggleMenu}
        className={`h-12 flex-row items-center justify-between rounded-xl border bg-white px-3.5 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <Text className={value ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
          {value ?? placeholder}
        </Text>
        <ChevronDown size={18} color="#94A3B8" />
      </Pressable>

      {open ? (
        <Animated.View
          style={menuStyle}
          className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-slate-100 bg-white"
        >
          <View className="p-1.5">
            {options.map((option) => {
              const selected = option === value;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    closeMenu();
                  }}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${
                    selected ? 'bg-blue-50' : 'active:bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-base ${
                      selected ? 'font-semibold text-blue-600' : 'text-ink'
                    }`}
                  >
                    {option}
                  </Text>
                  {selected && <Check size={18} color="#2563EB" />}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
