import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import {
  Camera,
  ChevronRight,
  CircleHelp,
  FileText,
  ExternalLink,
  Megaphone,
  LogOut,
  CalendarDays,
  Settings,
  Send,
} from 'lucide-react-native';

import AvatarActionSheet from './AvatarActionSheet';

type SidebarProps = {
  onClose?: () => void;
  avatarUri?: string | null;
  onAvatarChange?: (uri: string | null) => void;
};

const MENU_ITEMS = [
  { key: 'documents', label: 'Documents', Icon: FileText },
  { key: 'holidays', label: 'Holidays', Icon: CalendarDays },
  { key: 'announcements', label: 'Announcements', Icon: Megaphone },
  { key: 'requests', label: 'Requests', Icon: Send },
  { key: 'support', label: 'Support', Icon: CircleHelp },
  { key: 'settings', label: 'Settings', Icon: Settings },
] as const;

const PLACEHOLDER = require('../../../assets/pexels-rdne-7580937.jpg');

export default function Sidebar({ avatarUri, onAvatarChange }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState('documents');
  const [sheetVisible, setSheetVisible] = useState(false);

  const imageSource = avatarUri ? { uri: avatarUri } : PLACEHOLDER;

  return (
    <View className="flex-1 bg-[#0d3749] pb-10 pt-16">
      <View className="flex-1 px-6">
        {/* Profile section */}
        <View className="mt-4 items-center">
          {/* Avatar block: 110×110 wrapper contains the 96×96 frame at top-left
              and the 40×40 edit badge at bottom-right, using positive offsets
              so nothing extends past wrapper bounds on new-arch. */}
          <View style={{ width: 110, height: 104 }}>
            {/* Avatar frame */}
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 32,
                borderWidth: 2,
                borderColor: '#f9d36b',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#f9d36b',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 28,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Image
                  source={imageSource}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  accessibilityLabel="Profile photo"
                />
              </View>
            </View>

            {/* Edit badge — sibling of frame, positive offsets keep it inside wrapper */}
            <Pressable
              onPress={() => setSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit profile photo"
              hitSlop={10}
              style={{
                position: 'absolute',
                top: 68,
                left: 68,
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#f9d36b',
                borderWidth: 2.5,
                borderColor: '#0d3749',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 8,
                elevation: 20,
                zIndex: 50,
              }}
            >
              <Camera size={14} color="#0d3749" strokeWidth={2.4} />
            </Pressable>
          </View>

          <Text className="mt-3 text-2xl font-bold tracking-tight text-white">
            Akash Mehta
          </Text>
          <View className="mt-2 rounded-full bg-white/10 px-4 py-1">
            <Text className="text-[11px] font-bold tracking-[2px] text-white uppercase">
              PHL-2024-089
            </Text>
          </View>

          {/* View profile — minimal text link */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View profile"
            style={{ marginTop: 14 }}
            hitSlop={8}
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: '#f9d36b',
                    fontSize: 12.5,
                    fontWeight: '700',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    lineHeight: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(249, 211, 107, 0.5)',
                    paddingBottom: 2,
                  }}
                >
                  View Profile
                </Text>
                <ExternalLink
                  size={13}
                  color="#f9d36b"
                  strokeWidth={2.4}
                  style={{ marginLeft: 6 }}
                />
              </View>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View className="mx-2 mt-6 h-px bg-white/5" />

        {/* Navigation */}
        <View className="mt-5">
          {MENU_ITEMS.map((item) => {
            const isActive = activeMenu === item.key;
            const { Icon } = item;
            return (
              <Pressable
                key={item.key}
                onPress={() => setActiveMenu(item.key)}
                className={`mb-1.5 flex-row items-center rounded-2xl px-5 py-3.5 ${
                  isActive ? 'bg-[#f9d36b]' : ''
                }`}
              >
                <View className="h-6 w-6 items-center justify-center">
                  <Icon
                    size={22}
                    color={isActive ? '#0d3749' : '#ffffff'}
                    strokeWidth={2.2}
                  />
                </View>
                <Text
                  className={`ml-4 text-[16px] ${
                    isActive
                      ? 'font-bold text-[#0d3749]'
                      : 'font-medium text-white'
                  }`}
                >
                  {item.label}
                </Text>
                {isActive && (
                  <View className="ml-auto">
                    <ChevronRight size={18} color="#0d3749" strokeWidth={2.3} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1" />

        <View className="mx-2 mb-6 h-px bg-white/5" />

        {/* Sign out */}
        <Pressable
          onPress={() => setActiveMenu('signout')}
          className="mb-8 flex-row items-center px-5 py-2"
        >
          <View className="h-6 w-6 items-center justify-center">
            <LogOut size={20} color="#ffffff" strokeWidth={2.2} />
          </View>
          <Text className="ml-4 text-[16px] font-semibold text-white">
            Sign out
          </Text>
        </Pressable>
      </View>

      <AvatarActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        hasImage={!!avatarUri}
        onImagePicked={(uri) => onAvatarChange?.(uri)}
        onRemove={() => onAvatarChange?.(null)}
      />
    </View>
  );
}
