import { Feather, Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { currentUser } from '../data/currentUser';

const YELLOW = '#F5D14E';
const NAVY = '#14323F';

type MenuItem = {
  label: string;
  route: string;
  icon: (color: string) => ReactNode;
};

const MENU: MenuItem[] = [
  {
    label: 'Documents',
    route: '/documents',
    icon: (c) => <Feather name="file-text" size={20} color={c} />,
  },
  {
    label: 'Holidays',
    route: '/holidays',
    icon: (c) => <Feather name="calendar" size={20} color={c} />,
  },
  {
    label: 'Announcements',
    route: '/announcements',
    icon: (c) => <Ionicons name="megaphone-outline" size={20} color={c} />,
  },
  {
    label: 'Requests',
    route: '/requests',
    icon: (c) => <Feather name="send" size={20} color={c} />,
  },
  {
    label: 'Support',
    route: '/support',
    icon: (c) => <Feather name="help-circle" size={20} color={c} />,
  },
  {
    label: 'Settings',
    route: '/settings',
    icon: (c) => <Feather name="settings" size={20} color={c} />,
  },
];

export default function DrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: NAVY }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 28, paddingBottom: 28 }}
    >
      <View className="flex-1 px-5">
        {/* Top section: profile + menu */}
        <View>
          {/* Centered profile section */}
          <View className="items-center">
            {/* Profile photo with yellow outline + camera button */}
            <View className="relative h-20 w-20">
              <View className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#F5D14E]">
                <Image
                  source={{ uri: currentUser.avatar }}
                  className="h-full w-full"
                />
              </View>
              <Pressable className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-[#14323F] bg-[#F5D14E]">
                <Feather name="camera" size={13} color={NAVY} />
              </Pressable>
            </View>

            {/* Name + employee id pill */}
            <Text className="mt-4 text-lg font-bold text-white">
              {currentUser.name}
            </Text>
            <View className="mt-2 rounded-full bg-white/10 px-3 py-1">
              <Text className="text-xs text-white/80">
                {currentUser.employeeId}
              </Text>
            </View>

            {/* View profile link */}
            <Pressable className="mt-4 flex-row items-center gap-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-[#F5D14E] underline">
                View profile
              </Text>
              <Feather name="external-link" size={13} color={YELLOW} />
            </Pressable>
          </View>

          {/* Divider below profile section */}
          <View className="my-6 h-px bg-white/10" />

          {/* Menu items */}
          <View className="gap-2">
            {MENU.map((item) => {
              const isActive = pathname === item.route;
              const tint = isActive ? NAVY : '#FFFFFF';
              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    props.navigation.closeDrawer();
                    router.push(item.route);
                  }}
                  className={`flex-row items-center gap-4 rounded-2xl px-4 py-3.5 ${
                    isActive ? 'bg-[#F5D14E]' : ''
                  }`}
                >
                  {item.icon(tint)}
                  <Text
                    className={`flex-1 text-base ${
                      isActive ? 'font-semibold text-[#16202E]' : 'text-white'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {isActive && (
                    <Feather name="chevron-right" size={20} color={NAVY} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Spacer pushes Sign out toward the bottom */}
        <View className="flex-1" />

        {/* Bottom section: Sign out (pinned lower) */}
        <View>
          <View className="mb-4 h-px bg-white/10" />
          <Pressable className="flex-row items-center gap-4 rounded-2xl px-4 py-3.5">
            <Feather name="log-out" size={20} color="#FFFFFF" />
            <Text className="text-base text-white">Sign out</Text>
          </Pressable>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}
