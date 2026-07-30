import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAuth } from '../auth/AuthContext';
import { currentUser } from '../data/currentUser';
import { useUnreadCount } from './notifications/notificationsStore';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const DURATION = 320;
const EASING = Easing.inOut(Easing.cubic);

export default function Header() {
  const navigation = useNavigation();
  const router = useRouter();
  const unreadCount = useUnreadCount();
  // The signed-in employee's real name; the demo profile only as a fallback.
  const { user } = useAuth();
  const firstName = (user?.name ?? currentUser.name).trim().split(/\s+/)[0];

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  // 0 = collapsed (greeting), 1 = expanded (search bar).
  const open = useSharedValue(0);

  const openSearch = () => {
    setSearchOpen(true);
    open.value = withTiming(1, { duration: DURATION, easing: EASING });
    // Focus once the bar has room to appear.
    setTimeout(() => inputRef.current?.focus(), DURATION * 0.5);
  };

  const closeSearch = () => {
    inputRef.current?.blur();
    setQuery('');
    open.value = withTiming(0, { duration: DURATION, easing: EASING });
    setTimeout(() => setSearchOpen(false), DURATION);
  };

  // Greeting fades + shifts out as search opens.
  const greetingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.6], [1, 0]),
    transform: [{ translateX: interpolate(open.value, [0, 1], [0, -12]) }],
  }));

  // Search bar grows in from the right (width + fade). It's absolutely filling
  // the flexible middle region, so animating opacity + a slight scale-x reads as
  // "unrolling" toward the menu.
  const searchStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0.35, 1], [0, 1]),
    transform: [
      { translateX: interpolate(open.value, [0, 1], [24, 0]) },
      { scaleX: interpolate(open.value, [0, 1], [0.9, 1]) },
    ],
  }));

  // Only the search-trigger icon fades AND collapses its width, so the field can
  // extend up to the bell (which stays fixed).
  const searchTriggerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.5], [1, 0]),
    width: interpolate(open.value, [0, 1], [44, 0]),
    marginLeft: interpolate(open.value, [0, 1], [12, 0]),
  }));

  return (
    <View className="h-12 flex-row items-center">
      {/* Menu — fixed on the left. Usable even mid-search: dismisses the
          search bar so the drawer doesn't open over a focused keyboard. */}
      <Pressable
        onPress={() => {
          if (searchOpen) closeSearch();
          navigation.dispatch(DrawerActions.openDrawer());
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        className="mr-3 h-11 w-11 items-center justify-center active:scale-95"
      >
        {/* Three left-aligned bars of stepped width. */}
        <View className="gap-[5px]">
          <View className="h-[2.5px] w-6 rounded-full bg-ink" />
          <View className="h-[2.5px] w-3.5 rounded-full bg-ink" />
          <View className="h-[2.5px] w-5 rounded-full bg-ink" />
        </View>
      </Pressable>

      {/* Flexible middle: greeting (collapsed) with the search bar layered on
          top. h-full is required: the row's items-center would otherwise
          shrink this to the greeting's text height, squashing the absolutely
          positioned search bar with it. */}
      <View className="h-full min-w-0 flex-1 justify-center">
        <Animated.View style={greetingStyle} pointerEvents={searchOpen ? 'none' : 'auto'}>
          <Text numberOfLines={1} className="text-xl font-bold text-ink">
            {getGreeting()}, {firstName}
          </Text>
        </Animated.View>

        {searchOpen ? (
          <Animated.View
            style={searchStyle}
            className="absolute inset-x-0 top-0 bottom-0 flex-row items-center rounded-full border border-slate-200 bg-white px-3"
          >
            <Feather name="search" size={18} color="#64748B" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              className="ml-2 flex-1 text-base text-ink"
            />
            <Pressable
              onPress={closeSearch}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close search"
              className="ml-1 h-7 w-7 items-center justify-center active:opacity-60"
            >
              <Feather name="x" size={18} color="#64748B" />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>

      {/* Search trigger — collapses away while search is open */}
      <Animated.View
        style={searchTriggerStyle}
        pointerEvents={searchOpen ? 'none' : 'auto'}
        className="items-center justify-center overflow-hidden"
      >
        <Pressable
          onPress={openSearch}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Search"
          className="h-11 w-11 items-center justify-center active:scale-95"
        >
          <Feather name="search" size={22} color="#14323F" />
        </Pressable>
      </Animated.View>

      {/* Notifications — fixed, always visible */}
      <Pressable
        onPress={() => router.push('/notifications')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        className="ml-1 h-11 w-11 items-center justify-center active:scale-95"
      >
        <Feather name="bell" size={22} color="#14323F" />
        {unreadCount > 0 ? (
          <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-canvas bg-gold" />
        ) : null}
      </Pressable>
    </View>
  );
}
