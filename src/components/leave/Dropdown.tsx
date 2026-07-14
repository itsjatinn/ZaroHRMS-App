import { Check, ChevronDown } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

type DropdownProps = {
  value: string | null;
  placeholder: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  error?: boolean;
  className?: string;
};

const OPTION_HEIGHT = 44;
const MENU_PADDING = 12;

// Menus float over white cards, so they need a real shadow (stronger than
// cardShadow) to separate from the surface beneath.
const menuShadow: ViewStyle = {
  shadowColor: '#14323F',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 12,
};

// Lightweight select that overlays downward from the tapped field. Closes on
// outside tap via an oversized transparent backdrop behind the menu.
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

  const chevronStyle = {
    transform: [
      {
        rotate: slideProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  return (
    <View
      style={open ? { zIndex: 1000, elevation: 1000 } : undefined}
      className={`relative ${className}`}
    >
      <Pressable
        onPress={toggleMenu}
        className={`h-12 flex-row items-center justify-between rounded-xl border bg-white px-3.5 ${
          error ? 'border-red-400' : open ? 'border-slate-300' : 'border-slate-200'
        }`}
      >
        <Text className={value ? 'text-sm text-ink' : 'text-sm text-slate-400'}>
          {value ?? placeholder}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color="#94A3B8" />
        </Animated.View>
      </Pressable>

      {open ? (
        <>
          {/* Oversized invisible backdrop so tapping anywhere outside closes
              the menu. Sits under the menu in stacking order. */}
          <Pressable
            onPress={closeMenu}
            style={{
              position: 'absolute',
              top: -1000,
              bottom: -1000,
              left: -1000,
              right: -1000,
            }}
          />
          <Animated.View
            style={[menuStyle, menuShadow]}
            className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white"
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
                    style={{ height: OPTION_HEIGHT }}
                    className={`flex-row items-center justify-between rounded-xl px-3.5 ${
                      selected ? 'bg-slate-100' : 'active:bg-slate-50'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selected ? 'font-bold text-ink' : 'text-ink'
                      }`}
                    >
                      {option}
                    </Text>
                    {selected && (
                      <Check size={16} color="#14323F" strokeWidth={2.5} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}
