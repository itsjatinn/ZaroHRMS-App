import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../../../assets/logo_big.svg';

type SidebarProps = {
  onClose?: () => void;
};

export default function Sidebar({ onClose }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState('overview');

  const menuBase = 'flex-row items-center px-5 py-3';
  const menuActive = 'rounded-full bg-amber-200';

  return (
    <View className="flex-1 bg-[#0f2f3a] px-6 pb-10 pt-10">
      <View className="items-end">
        <Pressable
          className="h-12 w-12 items-center justify-center rounded-full border border-amber-200/40 opacity-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <Text className="text-xl text-amber-200">{'<'}</Text>
        </Pressable>
      </View>

      <View className="mt-1 items-center">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-white/10">
          <View className="h-24 w-24 overflow-hidden rounded-full">
            <Image
              source={require('../../../assets/pexels-rdne-7580937.jpg')}
              className="h-28 w-24 translate-y-0.2"
              resizeMode="cover"
              accessibilityLabel="Employee portrait"
            />
          </View>
        </View>
        <Text className="mt-3.5 text-2xl font-semibold text-white">Akash Mehta</Text>
        <Text className="mt-1.5 text-sm tracking-[2px] text-amber-200">EMP-ONB-001</Text>
        <Pressable className="mt-2 border-b border-white/80 pb-0.5">
          <Text className="text-base text-white">View Profile</Text>
        </Pressable>
      </View>

      <View className="mt-10">
        <Pressable
          onPress={() => setActiveMenu('overview')}
          className={`${menuBase} ${activeMenu === 'overview' ? menuActive : ''}`}
        >
          <View className="mr-3 h-6 w-6 items-center justify-center">
            <Feather
              name="home"
              size={20}
              color={activeMenu === 'overview' ? '#0f172a' : '#ffffff'}
            />
          </View>
          <Text
            className={`text-base ${activeMenu === 'overview' ? 'font-semibold text-slate-900' : 'text-white'}`}
          >
            Overview
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveMenu('employees')}
          className={`mt-2 ${menuBase} ${activeMenu === 'employees' ? menuActive : ''}`}
        >
          <View className="mr-3 h-6 w-6 items-center justify-center">
            <Feather name="users" size={20} color={activeMenu === 'employees' ? '#0f172a' : '#ffffff'} />
          </View>
          <Text
            className={`text-base ${activeMenu === 'employees' ? 'font-semibold text-slate-900' : 'text-white'}`}
          >
            Employees
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveMenu('vendor')}
          className={`mt-2 ${menuBase} ${activeMenu === 'vendor' ? menuActive : ''}`}
        >
          <View className="mr-3 h-6 w-6 items-center justify-center">
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={20}
              color={activeMenu === 'vendor' ? '#0f172a' : '#ffffff'}
            />
          </View>
          <Text
            className={`text-base ${activeMenu === 'vendor' ? 'font-semibold text-slate-900' : 'text-white'}`}
          >
            Vendor Dispatch
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveMenu('settings')}
          className={`mt-2 ${menuBase} ${activeMenu === 'settings' ? menuActive : ''}`}
        >
          <View className="mr-3 h-6 w-6 items-center justify-center">
            <Feather name="settings" size={20} color={activeMenu === 'settings' ? '#0f172a' : '#ffffff'} />
          </View>
          <Text
            className={`text-base ${activeMenu === 'settings' ? 'font-semibold text-slate-900' : 'text-white'}`}
          >
            Settings
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveMenu('signout')}
          className={`mt-2 ${menuBase} ${activeMenu === 'signout' ? menuActive : ''}`}
        >
          <View className="mr-3 h-6 w-6 items-center justify-center">
            <Feather name="log-out" size={20} color={activeMenu === 'signout' ? '#0f172a' : '#ffffff'} />
          </View>
          <Text
            className={`text-base ${activeMenu === 'signout' ? 'font-semibold text-slate-900' : 'text-white'}`}
          >
            Sign out
          </Text>
        </Pressable>
      </View>

      <View className="mt-auto items-center">
        <View className="relative h-16 w-16 items-center justify-center rounded-full border border-amber-200/40">
          <Feather name="bell" size={24} color="#fde68a" />
          <View className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-amber-200">
            <Text className="text-xs font-semibold text-slate-900">3</Text>
          </View>
        </View>

      </View>
    </View>
  );
}
