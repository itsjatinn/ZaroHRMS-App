import { Stack } from 'expo-router';

// Land on sign-in when the app redirects into the auth group.
export const unstable_settings = {
  initialRouteName: 'sign-in',
};

// Auth flow: sign-in -> forgot-password -> reset-password. No headers; each
// screen draws its own card. Animation matches the root stack.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 250,
      }}
    />
  );
}
