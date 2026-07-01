import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  LayoutAnimation,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CardEntrance, { StaggerItem } from './CardEntrance';
import { font } from './fonts';
import LoginVisual from './LoginVisual';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Hide the illustration (e.g. deeper flow screens that want more room). */
  showVisual?: boolean;
  /** Screen-specific illustration; defaults to the login artwork. */
  visualSource?: ImageSourcePropType;
};

// Shared scaffold for every auth screen, light & airy with no card: a brand
// illustration sits at the top, then a subtitle line and the form. Pages pass
// their fields and actions as children.
export default function AuthShell({
  title,
  subtitle,
  children,
  showVisual = true,
  visualSource,
}: AuthShellProps) {
  // Track the keyboard's real height. Under Android edge-to-edge the OS does not
  // resize the window, so we add the keyboard height as scroll padding ourselves
  // — that makes the content scroll every field above the keyboard. We also hide
  // the visual while typing to keep the form compact.
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const onShow = (e: { endCoordinates?: { height: number } }) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(0);
    };
    const show = Keyboard.addListener('keyboardDidShow', onShow);
    const hide = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const keyboardOpen = kbHeight > 0;

  // Center when the content fits the free space (viewport minus keyboard), else
  // top-anchor + scroll so nothing crops on small screens or with the keyboard.
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const availableH = viewportH - kbHeight;
  const fits = contentH > 0 && availableH > 0 && contentH <= availableH;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingTop: 20,
          paddingBottom: 24 + kbHeight,
          // Anchor to the top when the hero image is showing so it sits high on
          // the screen; otherwise center the form when it fits.
          justifyContent:
            showVisual && !keyboardOpen ? 'flex-start' : fits ? 'center' : 'flex-start',
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="w-full max-w-[440px] self-center"
          onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
        >
          <CardEntrance>
            {/* Brand illustration — sits near the top, nudged down a little. */}
            {showVisual && !keyboardOpen ? (
              <StaggerItem>
                <View className="mt-10 w-full items-center">
                  <LoginVisual source={visualSource} />
                </View>
              </StaggerItem>
            ) : null}

            {/* Heading — title + gold accent + subtitle, on every auth screen. */}
            <StaggerItem>
              <View className="mt-12">
                <Text
                  className="text-[30px] leading-tight text-ink"
                  style={{ fontFamily: font.bold }}
                >
                  {title}
                </Text>
                <View className="mb-2 mt-1.5 h-1 w-12 rounded-full bg-gold" />
                <Text
                  className="text-base text-[#5B6B72]"
                  style={{ fontFamily: font.regular }}
                >
                  {subtitle}
                </Text>
              </View>
            </StaggerItem>

            {/* Form fields + actions — sit right below the heading */}
            <View className="mt-5">{children}</View>
          </CardEntrance>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
