import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError } from './client';

// Shared cache for every screen. Phones move in and out of coverage, so queries
// retry a couple of times — except for auth/permission failures, which will
// never succeed on a retry.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 60_000,
      // Combined with the AppState wiring below, returning to the app
      // refetches whatever stale queries are on screen — data written while
      // the phone was in a pocket shows up without a manual pull-to-refresh.
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

// TanStack only knows about browser focus events. On native, teach it that
// "app returned to the foreground" is the focus signal. (On web the built-in
// visibilitychange handling already covers this.)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
}
