import { Feather, Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Alert } from './CrossAlert';

import { useMyProfile } from '../api/profile';
import { useProfilePhoto, useSaveProfilePhoto } from '../api/profilePhoto';
import { useIsManager } from '../api/team';
import { getInitials } from './profile/initials';
import PhotoCropModal, { type CropSource } from './profile/PhotoCropModal';
import PhotoPickerSheet from './profile/PhotoPickerSheet';
import { useAuth } from '../auth/AuthContext';
import { currentUser } from '../data/currentUser';

const YELLOW = '#F5D14E';
const NAVY = '#14323F';

type MenuItem = {
  label: string;
  route: string;
  icon: (color: string, size: number) => ReactNode;
};

const MENU: MenuItem[] = [
  {
    label: 'Holidays',
    route: '/events',
    icon: (c, size) => <Feather name="calendar" size={size} color={c} />,
  },
  {
    label: 'Celebrations',
    route: '/celebrations',
    icon: (c, size) => <Ionicons name="gift-outline" size={size} color={c} />,
  },
  {
    label: 'Announcements',
    route: '/announcements',
    icon: (c, size) => (
      <Ionicons name="megaphone-outline" size={size} color={c} />
    ),
  },
  // Support and Settings are hidden for now — both routes still exist, so
  // restoring these entries is all that's needed to bring them back.
  // {
  //   label: 'Support',
  //   route: '/support',
  //   icon: (c) => <Feather name="help-circle" size={20} color={c} />,
  // },
  // {
  //   label: 'Settings',
  //   route: '/settings',
  //   icon: (c) => <Feather name="settings" size={20} color={c} />,
  // },
];

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 740 || width < 370;
  const avatarSize = compact ? 64 : 72;
  const avatarRadius = compact ? 18 : 20;
  const cameraSize = compact ? 25 : 27;
  const contentTop = compact ? 46 : 58;
  const contentBottom = compact ? 24 : 32;
  const menuIconSize = compact ? 18 : 19;
  const menuTextSize = compact ? 15 : 16;
  const menuRowPaddingY = compact ? 10 : 12;
  const menuRowPaddingX = compact ? 8 : 10;
  const menuGap = compact ? 4 : 6;
  const dividerMargin = compact ? 20 : 24;

  // Live identity for the sidebar header — name from the login session, the
  // rest from the profile read. The demo session keeps the sample identity.
  const { isBackendSession, user, signOut } = useAuth();
  // My Team is a manager surface — same composite gate as the approvals tab
  // (explicit role OR reporting lines).
  const managerAccess = useIsManager();
  const menu: MenuItem[] = managerAccess.isManager
    ? [
        {
          label: 'My Team',
          route: '/my-team',
          icon: (c, size) => <Feather name="users" size={size} color={c} />,
        },
        ...MENU,
      ]
    : MENU;
  const profileQuery = useMyProfile(isBackendSession);
  const photoQuery = useProfilePhoto(isBackendSession);
  const savePhoto = useSaveProfilePhoto();
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  // URI of the image being cropped, between picking and saving.
  const [cropSource, setCropSource] = useState<CropSource | null>(null);

  const savePhotoValue = (dataUrl: string | null) => {
    if (!isBackendSession) {
      Alert.alert('Sign in to save', 'Photo changes need a live HRMS session.');
      return;
    }
    savePhoto.mutate(dataUrl, {
      onError: () =>
        Alert.alert(
          'Could not save your photo',
          'Please try again in a moment.',
        ),
    });
  };
  const identity = isBackendSession
    ? {
        name: profileQuery.data?.name || user?.name || currentUser.name,
        // Null rather than a dash: the pill is hidden until a real value
        // arrives, so a still-loading profile never renders a placeholder that
        // looks like data.
        subtitle: profileQuery.data?.designation?.trim() || null,
        // The employee's own picture wins; the HR-set master photo is the
        // fallback. With neither, initials — never the sample portrait, which
        // would show a stranger's face as this employee's photo.
        avatar: photoQuery.data || profileQuery.data?.profilePhoto || null,
      }
    : { ...currentUser, subtitle: currentUser.designation };

  const router = useRouter();
  const pathname = usePathname();

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: NAVY }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: contentTop,
        paddingBottom: contentBottom,
      }}
    >
      <View className="flex-1 px-4">
        {/* Top section: profile + menu */}
        <View>
          {/* Centered profile section */}
          <View className="items-center">
            {/* Profile photo with yellow outline + camera button */}
            <View
              className="relative"
              style={{ width: avatarSize, height: avatarSize }}
            >
              <View
                className="overflow-hidden border-2 border-[#F5D14E]"
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarRadius,
                }}
              >
                {identity.avatar ? (
                  <Image
                    source={{ uri: identity.avatar }}
                    className="h-full w-full"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-white/10">
                    <Text
                      className="font-bold text-white"
                      style={{ fontSize: compact ? 21 : 23 }}
                    >
                      {getInitials(identity.name, user?.email)}
                    </Text>
                  </View>
                )}
              </View>
              {savePhoto.isPending ? (
                <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/45">
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
              <Pressable
                onPress={() => setPhotoSheetOpen(true)}
                disabled={savePhoto.isPending}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                className="absolute -bottom-1 -right-1 items-center justify-center rounded-full border-2 border-[#14323F] bg-[#F5D14E] active:scale-95"
                style={{ width: cameraSize, height: cameraSize }}
              >
                <Feather name="camera" size={compact ? 12 : 13} color={NAVY} />
              </Pressable>
            </View>

            {/* Name + employee id pill */}
            <Text
              className="mt-4 font-bold text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontSize: compact ? 21 : 23 }}
            >
              {identity.name}
            </Text>
            {identity.subtitle ? (
              <View className="mt-2 max-w-full rounded-full bg-white/10 px-3 py-1">
                <Text
                  className="text-white/80"
                  numberOfLines={1}
                  style={{ fontSize: compact ? 11 : 12 }}
                >
                  {identity.subtitle}
                </Text>
              </View>
            ) : null}

            {/* View profile link */}
            <Pressable
              onPress={() => {
                props.navigation.closeDrawer();
                router.push('/view-profile');
              }}
              className="mt-4 flex-row items-center gap-1"
            >
              <Text
                className="font-semibold uppercase tracking-wide text-[#F5D14E] underline"
                style={{ fontSize: compact ? 11 : 12 }}
              >
                View profile
              </Text>
              <Feather name="external-link" size={compact ? 12 : 13} color={YELLOW} />
            </Pressable>
          </View>

          {/* Divider below profile section */}
          <View className="h-px bg-white/10" style={{ marginVertical: dividerMargin }} />

          {/* Menu items */}
          <View style={{ gap: menuGap }}>
            {menu.map((item) => {
              const isActive = pathname === item.route;
              const tint = isActive ? NAVY : '#FFFFFF';
              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    props.navigation.closeDrawer();
                    router.push(item.route);
                  }}
                  className={`flex-row items-center gap-3 rounded-2xl ${
                    isActive ? 'bg-[#F5D14E]' : 'active:bg-white/10'
                  }`}
                  style={{
                    paddingHorizontal: menuRowPaddingX,
                    paddingVertical: menuRowPaddingY,
                  }}
                >
                  <View className="w-7 items-center">
                    {item.icon(tint, menuIconSize)}
                  </View>
                  <Text
                    className={`flex-1 ${
                      isActive ? 'font-semibold text-[#16202E]' : 'text-white'
                    }`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    style={{ fontSize: menuTextSize }}
                  >
                    {item.label}
                  </Text>
                  {isActive && (
                    <Feather name="chevron-right" size={menuIconSize} color={NAVY} />
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
          <Pressable
            onPress={() => void signOut()}
            className="mb-2 flex-row items-center gap-3 rounded-2xl active:bg-white/10"
            style={{
              paddingHorizontal: menuRowPaddingX,
              paddingVertical: menuRowPaddingY,
            }}
          >
            <View className="w-7 items-center">
              <Feather name="log-out" size={menuIconSize} color="#FFFFFF" />
            </View>
            <Text className="text-white" style={{ fontSize: menuTextSize }}>
              Sign out
            </Text>
          </Pressable>
        </View>
      </View>
      <PhotoPickerSheet
        visible={photoSheetOpen}
        hasPhoto={Boolean(photoQuery.data)}
        onClose={() => setPhotoSheetOpen(false)}
        onPicked={savePhotoValue}
        onCrop={(picked) => {
          setPhotoSheetOpen(false);
          setCropSource(picked);
        }}
      />

      <PhotoCropModal
        source={cropSource}
        onCancel={() => setCropSource(null)}
        onDone={(dataUrl) => {
          setCropSource(null);
          savePhotoValue(dataUrl);
        }}
      />
    </DrawerContentScrollView>
  );
}
