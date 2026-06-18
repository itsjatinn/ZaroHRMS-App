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
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.92]) }],
    borderRadius: interpolate(progress.value, [0, 1], [0, 40]),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#14323F' }}>
      <Animated.View style={sceneStyle}>{children}</Animated.View>
    </View>
  );
}

// Wraps the active tab's icon in a rounded square with a thin yellow outline.
function TabIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  return (
    <View
      style={{
        width: 48,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: focused ? 1 : 0,
        borderColor: focused ? ACTIVE : 'transparent',
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
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#16202E',
          borderTopWidth: 0,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
