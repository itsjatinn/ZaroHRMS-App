import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDrawerProgress } from '@react-navigation/drawer';
import { Tabs } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE = '#F5D14E';
const INACTIVE = '#FFFFFF';

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

  // Dims the home screen as the drawer opens (0 = closed, 1 = open).
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

// Wraps the active tab's icon in a rounded square with a thin yellow outline.
function TabIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  return (
    <View
      style={{
        width: 46,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderWidth: focused ? 1.5 : 0,
        borderColor: focused ? ACTIVE : 'transparent',
        backgroundColor: focused ? 'rgba(245, 209, 78, 0.05)' : 'transparent',
      }}
    >
      {children}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <AnimatedScene>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#14323F',
          borderTopWidth: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          height: 80 + insets.bottom,
          paddingTop: 14,
          paddingBottom: insets.bottom + 12,
          overflow: 'hidden',
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Feather name="home" size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={22}
                color={color}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Feather name="calendar" size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="payslips"
        options={{
          title: 'Payslips',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Feather name="file-text" size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      </Tabs>
    </AnimatedScene>
  );
}
