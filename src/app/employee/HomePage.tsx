import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
  ScrollView,
} from 'react-native';
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  UserRound,
  CircleEllipsis,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Sidebar from '../components/Sidebar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRANSLATE_X = SCREEN_WIDTH * 0.7;
const SCALE = 0.85;
const BORDER_RADIUS = 32;
const DURATION = 450;
const FOOTER_VISUAL_HEIGHT = 84;
const FOOTER_TAB_HEIGHT = 68;

const STATS = [
  { value: '06', label: 'Pending', color: '#0d3749' },
  { value: '15', label: 'In Progress', color: '#0d3749' },
  { value: '29', label: 'Completed', color: '#0d3749' },
];

const CARDS = [
  { label: 'My Tasks',      sub: '34 tasks assigned',  Icon: ClipboardList },
  { label: 'Leave Request', sub: '2 pending approval',  Icon: CalendarDays },
  { label: 'Payslip',       sub: 'Feb 2026 available',  Icon: FileText },
  { label: 'My Profile',    sub: 'PHL-2024-089',        Icon: UserRound },
];

const FOOTER_TABS = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
  { key: 'leave', label: 'Leave', Icon: CalendarDays },
  { key: 'payslips', label: 'Payslips', Icon: FileText },
  { key: 'more', label: 'More', Icon: CircleEllipsis },
] as const;

function Card({ card }: { card: (typeof CARDS)[number] }) {
  const { Icon } = card;

  return (
    <Pressable
      className="flex-1 rounded-[32px] bg-white p-5"
      style={{
        shadowColor: '#0d3749',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
      }}
      accessibilityRole="button"
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f4f8]">
        <Icon size={24} color="#0d3749" strokeWidth={2.2} />
      </View>
      <Text className="mt-5 text-[17px] font-bold text-[#0d3749] tracking-tight">{card.label}</Text>
      <Text className="mt-1 text-[13px] text-slate-500 font-medium">{card.sub}</Text>
    </Pressable>
  );
}

export default function HomePage() {
  const insets = useSafeAreaInsets();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [activeFooterTab, setActiveFooterTab] =
    useState<(typeof FOOTER_TABS)[number]['key']>('home');
  const progress = useRef(new Animated.Value(0)).current;

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const closeSidebar = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: DURATION,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  }, [progress]);

  const mainTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRANSLATE_X],
  });
  const mainScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, SCALE],
  });
  const sidebarTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.2, 0],
  });
  const sidebarOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View className="flex-1 bg-[#0d3749]">
      <StatusBar barStyle="light-content" />

      {/* Sidebar */}
      {sidebarVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: SCREEN_WIDTH * 0.75,
            zIndex: 0,
            transform: [{ translateX: sidebarTranslateX }],
            opacity: sidebarOpacity,
          }}
        >
          <Sidebar
            onClose={closeSidebar}
            avatarUri={avatarUri}
            onAvatarChange={setAvatarUri}
          />
        </Animated.View>
      )}

      {/* Main Content */}
      <Animated.View
        style={{
          flex: 1,
          overflow: 'hidden',
          zIndex: 10,
          borderRadius: sidebarVisible ? BORDER_RADIUS : 0,
          transform: [{ translateX: mainTranslateX }, { scale: mainScale }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: sidebarVisible ? 0.3 : 0,
          shadowRadius: 30,
          elevation: sidebarVisible ? 20 : 0,
        }}
      >
        {sidebarVisible && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000',
              zIndex: 50,
              opacity: overlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeSidebar} />
          </Animated.View>
        )}

        <View className="flex-1 bg-[#f7f9fb]">
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{
              paddingBottom: FOOTER_VISUAL_HEIGHT + insets.bottom + 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Custom App Bar ── */}
            <View className="px-6 pt-16 pb-6">
              <View className="flex-row items-center justify-between">
                {/* Logo slot — reserved for brand mark */}
                <View className="h-12 justify-center" />

                <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 5,
                    elevation: 2
                  }}
                >
                  <Bell size={20} color="#0d3749" strokeWidth={2.2} />
                  <View className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
                </Pressable>
              </View>
            </View>

            {/* ── Profile Section ── */}
            <View className="px-6 mt-4">
              <View className="flex-row items-center">
                <View className="h-16 w-16 rounded-[24px] bg-[#0d3749] items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                      accessibilityLabel="Profile photo"
                    />
                  ) : (
                    <Text className="text-white text-xl font-bold">AM</Text>
                  )}
                </View>
                <View className="ml-4">
                  <Text className="text-[22px] font-bold text-[#0d3749]">Akash Mehta</Text>
                  <View className="flex-row items-center mt-0.5">
                    <View className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2" />
                    <Text className="text-[13px] text-slate-500 font-medium">PHL-2024-089 • Online</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Stats Dashboard ── */}
            <View className="px-6 mt-8">
              <View className="flex-row gap-3">
                {STATS.map((stat, index) => (
                  <View 
                    key={index} 
                    className="flex-1 rounded-[28px] bg-white p-4 items-center justify-center"
                    style={{
                      shadowColor: '#0d3749',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.04,
                      shadowRadius: 15,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</Text>
                    <Text className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Quick Actions Grid ── */}
            <View className="px-6 mt-8">
              <Text className="text-[18px] font-bold text-[#0d3749] mb-5 px-1">Quick Actions</Text>
              <View className="gap-4">
                <View className="flex-row gap-4">
                  <Card card={CARDS[0]} />
                  <Card card={CARDS[1]} />
                </View>
                <View className="flex-row gap-4">
                  <Card card={CARDS[2]} />
                  <Card card={CARDS[3]} />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* ── Footer Navigation ── */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: Math.max(insets.bottom, 32),
                backgroundColor: '#0d3749',
              }}
            />
            <View
              className="flex-row items-start justify-between px-5 pt-2"
              style={{
                height: FOOTER_VISUAL_HEIGHT + insets.bottom,
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: '#0d3749',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                shadowColor: '#0d3749',
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.16,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {FOOTER_TABS.map((tab) => {
                const isActive = activeFooterTab === tab.key;
                const isMore = tab.key === 'more';
                const { Icon } = tab;

                return (
                  <Pressable
                    key={tab.key}
                    accessibilityRole="button"
                    accessibilityLabel={tab.label}
                    onPress={() => {
                      if (isMore) {
                        openSidebar();
                        return;
                      }

                      setActiveFooterTab(tab.key);
                    }}
                    className="flex-1 items-center justify-center"
                    style={{ height: FOOTER_TAB_HEIGHT }}
                  >
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 18,
                      }}
                    >
                      {isActive && (
                        <View
                          className="absolute rounded-[18px]"
                          style={{
                            width: 48,
                            height: 48,
                            borderWidth: 1.8,
                            borderColor: '#f9d36b',
                            backgroundColor: 'rgba(249, 211, 107, 0.09)',
                          }}
                        />
                      )}
                      <Icon
                        size={22}
                        color={isActive ? '#f9d36b' : '#ffffff'}
                        strokeWidth={2.2}
                      />
                    </View>
                    <Text
                      className={`mt-1 text-center text-[13.5px] leading-[16px] ${
                        isActive ? 'font-semibold text-[#f9d36b]' : 'font-medium text-white'
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
