import '../global.css';

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
import { useEffect, useState } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../src/api/queryClient';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import AnimatedSplash from '../src/components/AnimatedSplash';
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
function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isAuthenticated, isLoading } = useAuth();

  // `appReady` flips once fonts + session are restored. Until then the native
  // splash covers everything; afterwards we hand off to the animated splash,
  // which plays its premium entrance/exit before unmounting via `splashDone`.
  const appReady = fontsLoaded && !isLoading;
  const [splashDone, setSplashDone] = useState(false);

  // Hide the native splash as soon as the app is ready. The animated splash is
  // already mounted on top (opaque white), so there is no flash in between. The
  // navigator stays mounted the whole time — returning a non-navigator anywhere
  // in the root tree would break Expo Router's navigation context.
  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  return (
    <>
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

      {!splashDone && (
        <AnimatedSplash
          isAppReady={appReady}
          // Page-turn slide only when handing off to the auth card (which slides
          // in to meet it). Going straight to the app, fade out instead.
          slideExit={!isAuthenticated}
          onFinish={() => setSplashDone(true)}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator fontsLoaded={fontsLoaded} />
            <StatusBar style="dark" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
