import {
  Bell,
  Globe,
  Info,
  Lock,
  LogOut,
  Moon,
  Shield,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useAuth } from '../../src/auth/AuthContext';
import BackButton from '../../src/components/BackButton';
import SettingsRow, { SectionLabel } from '../../src/components/settings/SettingsRow';
import { cardShadow } from '../../src/components/shadow';
import { currentUser } from '../../src/data/currentUser';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const soon = (label: string) => Alert.alert(label, 'Coming soon.');

  const confirmSignOut = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#F4F3EF]">
      <BackButton title="Settings" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={cardShadow} className="flex-row items-center gap-4 rounded-2xl bg-white p-5">
          <View className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#F5D14E]">
            <Image source={{ uri: currentUser.avatar }} className="h-full w-full" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-ink">{currentUser.name}</Text>
            <Text className="text-xs text-slate-400">{currentUser.employeeId}</Text>
          </View>
          <Pressable
            onPress={() => soon('Edit profile')}
            className="rounded-full border border-slate-200 px-3.5 py-2 active:scale-95"
          >
            <Text className="text-xs font-semibold text-slate-600">Edit</Text>
          </Pressable>
        </View>

        {/* Account */}
        <View>
          <SectionLabel>Account</SectionLabel>
          <View style={cardShadow} className="rounded-2xl bg-white px-5 py-1">
            <SettingsRow first icon={User} color="#2563EB" badge="bg-blue-100" label="Edit Profile" onPress={() => soon('Edit profile')} />
            <SettingsRow icon={Lock} color="#6B5FCF" badge="bg-violet-100" label="Change Password" onPress={() => soon('Change password')} />
            <SettingsRow icon={Shield} color="#059669" badge="bg-emerald-100" label="Privacy & Security" onPress={() => soon('Privacy & Security')} />
          </View>
        </View>

        {/* Preferences */}
        <View>
          <SectionLabel>Preferences</SectionLabel>
          <View style={cardShadow} className="rounded-2xl bg-white px-5 py-1">
            {/* Notifications toggle */}
            <View className="flex-row items-center gap-3 py-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <Bell size={17} color="#D9A53B" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-ink">Push Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ true: '#14323F', false: '#CBD5E1' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {/* Dark mode toggle */}
            <View className="flex-row items-center gap-3 border-t border-slate-100 py-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Moon size={17} color="#475569" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-ink">Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ true: '#14323F', false: '#CBD5E1' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <SettingsRow icon={Globe} color="#0EA5E9" badge="bg-sky-100" label="Language" value="English" onPress={() => soon('Language')} />
          </View>
        </View>

        {/* More */}
        <View>
          <SectionLabel>More</SectionLabel>
          <View style={cardShadow} className="rounded-2xl bg-white px-5 py-1">
            <SettingsRow first icon={Info} color="#6B5FCF" badge="bg-violet-100" label="About zaroHRMS" value="v1.0.0" onPress={() => soon('About')} />
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={confirmSignOut}
          style={cardShadow}
          className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-white active:scale-[0.98]"
        >
          <LogOut size={18} color="#E11D48" />
          <Text className="text-sm font-bold text-[#E11D48]">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
