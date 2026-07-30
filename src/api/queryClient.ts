import { QueryClient } from '@tanstack/react-query';

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
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
