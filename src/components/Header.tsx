import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
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
const WEB_INPUT_RESET =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        outlineWidth: 0,
        boxShadow: 'none',
      } as const)
    : null;

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

  // Search bar grows in from the right. It overlays the header row between the
  // fixed menu and bell controls, so no sibling width animation can squeeze it.
  const searchStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0.35, 1], [0, 1]),
    transform: [
      { translateX: interpolate(open.value, [0, 1], [24, 0]) },
      { scaleX: interpolate(open.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const searchTriggerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.5], [1, 0]),
  }));

  return (
    <View className="relative h-12 flex-row items-center">
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

      {searchOpen ? (
        <Animated.View
          style={[
            searchStyle,
            {
              position: 'absolute',
              left: 56,
              right: 52,
              top: 0,
              bottom: 0,
              zIndex: 20,
              height: 48,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#CBD5E1',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 12,
            },
          ]}
        >
          <Feather name="search" size={18} color="#64748B" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            style={[
              {
                marginLeft: 8,
                height: '100%',
                minWidth: 0,
                flex: 1,
                paddingVertical: 0,
                fontSize: 16,
                color: '#14323F',
              },
              WEB_INPUT_RESET,
            ]}
          />
          <Pressable
            onPress={closeSearch}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close search"
            style={{
              marginLeft: 4,
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
            }}
          >
            <Feather name="x" size={18} color="#64748B" />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}
