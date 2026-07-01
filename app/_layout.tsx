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
import { Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import AnimatedSplash from '../src/components/AnimatedSplash';

// Keep the native splash up until fonts and the persisted session are both
// ready, so we never render text in a fallback font or flash the sign-in screen.
SplashScreen.preventAutoHideAsync();

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enableNative: true,
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

textDefaults.defaultProps = {
  ...textDefaults.defaultProps,
  style: [
    textDefaults.defaultProps?.style,
    { fontFamily: 'PlusJakartaSans_400Regular' },
  ],
};
textInputDefaults.defaultProps = {
  ...textInputDefaults.defaultProps,
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
        <AuthProvider>
          <RootNavigator fontsLoaded={fontsLoaded} />
          <StatusBar style="dark" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
