import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDrawerProgress } from '@react-navigation/drawer';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE = '#F5D14E';
const INACTIVE = '#FFFFFF';
const BAR_HEIGHT = 78;
const TAB_SLOT_WIDTH = 84;

// Per-route icon renderers, keyed by route name.
const ICONS: Record<string, (color: string) => ReactNode> = {
  index: (color) => <Feather name="home" size={22} color={color} />,
  attendance: (color) => (
    <MaterialCommunityIcons name="calendar-check" size={22} color={color} />
  ),
  leave: (color) => <Feather name="calendar" size={22} color={color} />,
};

// Shrinks + rounds the screen as the drawer opens (0 = closed, 1 = open),
// revealing the navy backdrop around it.
function AnimatedScene({ children }: { children: ReactNode }) {
  const progress = useDrawerProgress();

  const sceneStyle = useAnimatedStyle(() => ({
    flex: 1,
    overflow: 'hidden',
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.8]) }],
    borderRadius: interpolate(progress.value, [0, 1], [0, 40]),
  }));

  const dimStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    opacity: interpolate(progress.value, [0, 1], [0, 0.45]),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#14323F' }}>
      <Animated.View style={sceneStyle}>
        {children}
        <Animated.View pointerEvents="none" style={dimStyle} />
      </Animated.View>
    </View>
  );
}

/**
 * Custom floating tab bar. Laying it out ourselves guarantees the icon + label
 * block is perfectly centered (equal top/bottom gaps) with no hidden safe-area
 * inset skewing it, which the default tab bar was doing.
 */
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barWidth = Math.min(width - 56, state.routes.length * TAB_SLOT_WIDTH + 28);

  return (
    <View
      style={{
        position: 'absolute',
        left: (width - barWidth) / 2,
        bottom: insets.bottom + 6,
        width: barWidth,
        height: BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        backgroundColor: '#14323F',
        borderRadius: 26,
        shadowColor: '#0B1F27',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 12,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const focused = state.index === index;
        const color = focused ? ACTIVE : INACTIVE;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={{
              width: TAB_SLOT_WIDTH,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Active tab: rounded square with a thin gold border + soft fill.
                Inactive keeps the same-size box (transparent border) so the
                icon→label gap is identical across every tab. */}
            <View
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 13,
                borderWidth: 1.5,
                borderColor: focused ? ACTIVE : 'transparent',
                backgroundColor: focused ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              }}
            >
              {ICONS[route.name]?.(color)}
            </View>
            <Text
              numberOfLines={1}
              style={{
                marginTop: 1,
                fontSize: 12,
                fontWeight: '600',
                color,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <AnimatedScene>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift',
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="attendance" options={{ title: 'Attendance' }} />
        <Tabs.Screen name="leave" options={{ title: 'Leave' }} />
      </Tabs>
    </AnimatedScene>
  );
}
