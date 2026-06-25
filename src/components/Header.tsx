import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { currentUser } from '../data/currentUser';
import { cardShadow } from './shadow';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

export default function Header() {
  const navigation = useNavigation();
  const firstName = currentUser.name.split(' ')[0];

  return (
    <View className="flex-row items-center justify-between gap-3">
      {/* Left: hamburger + greeting */}
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={cardShadow}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-white transition duration-200 active:scale-95"
        >
          <Feather name="menu" size={22} color="#14323F" />
        </Pressable>

        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {TODAY}
          </Text>
          <Text
            numberOfLines={1}
            className="mt-0.5 text-xl font-bold text-ink"
          >
            {getGreeting()}, {firstName}
          </Text>
        </View>
      </View>

      {/* Right: search + bell (bell has a yellow dot) */}
      <View className="flex-row items-center gap-2">
        <Pressable style={cardShadow} className="h-12 w-12 items-center justify-center rounded-2xl bg-white transition duration-200 active:scale-95">
          <Feather name="search" size={20} color="#14323F" />
        </Pressable>

        <Pressable style={cardShadow} className="h-12 w-12 items-center justify-center rounded-2xl bg-white transition duration-200 active:scale-95">
          <Feather name="bell" size={20} color="#14323F" />
          <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-gold" />
        </Pressable>
      </View>
    </View>
  );
}
