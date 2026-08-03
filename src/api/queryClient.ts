import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { AppState, Platform } from 'react-native';

import { ApiError } from './client';

/** How long a persisted snapshot stays usable across launches. */
export const QUERY_CACHE_MAX_AGE = 24 * 3600_000;

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
      // Must outlive QUERY_CACHE_MAX_AGE, or restored-from-disk entries are
      // garbage-collected before the screens they belong to remount.
      gcTime: QUERY_CACHE_MAX_AGE,
      // Combined with the AppState wiring below, returning to the app
      // refetches whatever stale queries are on screen — data written while
      // the phone was in a pocket shows up without a manual pull-to-refresh.
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

/**
 * Disk snapshot of the query cache (AsyncStorage on native, localStorage on
 * web). On a cold start the last session's data hydrates before the first
 * screen renders, so home shows real content immediately after the splash
 * instead of an empty background while everything refetches — the refetches
 * still run, just behind visible data.
 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'zarohr-query-cache',
  // Batch rapid cache updates into one disk write.
  throttleTime: 2_000,
});

// TanStack only knows about browser focus events. On native, teach it that
// "app returned to the foreground" is the focus signal. (On web the built-in
// visibilitychange handling already covers this.)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
}
