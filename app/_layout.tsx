import '../global.css';

import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../src/api/queryClient';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { splashExiting } from '../src/components/auth/authTiming';
import { lockViewportToDesignWidth } from '../src/web/viewport';

// Disable react-freeze. When a screen is pushed on top, freeze suspends the
// screen below and re-renders it on return; on Android that re-measure clips the
// last character of bold custom-font text (e.g. "Sign in" -> "Sign ir" after
// returning from forgot-password). Keeping screens unfrozen preserves the
// original, correct text layout.
enableFreeze(false);

// Web only, and at module scope so it lands before the first render rather than
// after — the splash covers the bundle download, so the scale is already
// correct by the time anything is visible. No-op on native.
lockViewportToDesignWidth();

function ensureWebInstallMetadata() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const ensureLink = (rel: string, href: string) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
  };

  ensureLink('manifest', '/manifest.webmanifest');
  ensureLink('apple-touch-icon', '/apple-touch-icon.png');
}

// Keep the native splash up until fonts and the persisted session are both
// ready, so we never render text in a fallback font or flash the sign-in screen.
SplashScreen.preventAutoHideAsync();

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Native crash reporting only exists on iOS/Android; on web it must be off
    // or init throws. JS error reporting still works on all platforms.
    enableNative: Platform.OS !== 'web',
  });
}

const textDefaults = Text as typeof Text & {
  defaultProps?: {
    style?: unknown;
    allowFontScaling?: boolean;
  };
};
const textInputDefaults = TextInput as typeof TextInput & {
  defaultProps?: {
    style?: unknown;
    allowFontScaling?: boolean;
  };
};

// The UI is laid out at the fixed sizes from the mockups. Letting the OS scale
// fonts (large "Font size"/"Display size" on many Android phones, e.g. MIUI)
// inflates every label and causes text to clip or overflow horizontally on some
// devices. Cap scaling so the layout renders consistently across screen sizes.
textDefaults.defaultProps = {
  ...textDefaults.defaultProps,
  allowFontScaling: false,
  style: [
    textDefaults.defaultProps?.style,
    { fontFamily: 'PlusJakartaSans_400Regular' },
  ],
};
textInputDefaults.defaultProps = {
  ...textInputDefaults.defaultProps,
  allowFontScaling: false,
  style: [
    textInputDefaults.defaultProps?.style,
    { fontFamily: 'PlusJakartaSans_400Regular' },
  ],
};

// Declares which route group is reachable based on auth state. Expo Router
// removes the guarded-out group and redirects to the available one, so signing
// in/out automatically swaps between the auth flow and the app.
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();

  // `appReady` flips once fonts + session are restored. Until then the
  // platform splash covers everything; once ready we hide it and let the app
  // render directly, avoiding a second React splash screen.
  const appReady = fontsReady && !isLoading;

  useEffect(() => {
    if (!appReady) return;
    void SplashScreen.hideAsync();
    // Auth CardEntrance used to listen to the custom splash overlay. With the
    // built-in splash as the only startup screen, this edge starts that same
    // entrance when the platform splash leaves.
    splashExiting.value = 1;
  }, [appReady]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 250,
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(drawer)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Icon fonts must be preloaded here alongside the text fonts: on web,
  // @expo/vector-icons otherwise fetches each family lazily on first icon
  // mount, and that internal load has no rejection handler — a slow fetch
  // hits expo-font's 6s FontFaceObserver timeout as an uncaught "6000ms
  // timeout exceeded" error and the icons stay blank. Loading everything
  // through useFonts happens behind the splash and routes failures into
  // `fontError` instead.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    ...Feather.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    ensureWebInstallMetadata();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, overflow: 'hidden' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator fontsReady={fontsReady} />
            <StatusBar style="dark" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
