import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { currentUser } from '../data/currentUser';
import { cardShadow } from './shadow';

export default function Header() {
  const navigation = useNavigation();

  return (
    <View className="flex-row items-center justify-between">
      {/* Left: hamburger + greeting */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={cardShadow}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
        >
          <Feather name="menu" size={22} color="#14323F" />
        </Pressable>

        <View>
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Thursday, Apr 24
          </Text>
          <Text className="text-xl font-bold text-ink">
            Good morning, {currentUser.name}
          </Text>
        </View>
      </View>

      {/* Right: search + bell (bell has a yellow dot) */}
      <View className="flex-row items-center gap-2">
        <Pressable style={cardShadow} className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
          <Feather name="search" size={20} color="#14323F" />
        </Pressable>

        <Pressable style={cardShadow} className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
          <Feather name="bell" size={20} color="#14323F" />
          <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-gold" />
        </Pressable>
      </View>
    </View>
  );
}
