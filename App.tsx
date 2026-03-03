import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import { NativeWindStyleSheet } from 'nativewind';
import HomePage from './src/app/Home/HomePage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

if (NativeWindStyleSheet?.setOutput) {
  NativeWindStyleSheet.setOutput({ default: 'native' });
}

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enableNative: true,
  });
}

export default function App() {
  return (
    <SafeAreaProvider>
      <HomePage />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
