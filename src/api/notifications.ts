import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';

/**
 * Notifications — the same endpoints the web notification centre uses
 * (backend/src/notifications/notifications.controller.ts).
 *
 * `zone` scopes the feed: the HR pages ask for 'hr', the employee pages for
 * 'employee'. The app is the employee surface, so it always asks for
 * 'employee' and never sees HR-only rows.
 */

export type ServerNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

/** How many rows one page pulls — the web's feed uses the same order. */
const PAGE_LIMIT = 50;
const ZONE = 'employee';

export const notificationKeys = {
  list: (filter: string) => ['notifications', 'list', filter] as const,
  unread: () => ['notifications', 'unread-count'] as const,
};

/** `filter` is 'all' or 'unread'; typed groups are filtered client-side. */
export function useNotificationFeed(filter: 'all' | 'unread', enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: async ({ signal }) => {
      const result = await api.get<{
        items?: ServerNotification[];
        unreadCount?: number;
        nextCursor?: string | null;
      }>(
        `/notifications?limit=${PAGE_LIMIT}&filter=${filter}&zone=${ZONE}`,
        { signal },
      );
      return {
        items: Array.isArray(result?.items) ? result.items : [],
        unreadCount: result?.unreadCount ?? 0,
        nextCursor: result?.nextCursor ?? null,
      };
    },
    staleTime: 30_000,
    enabled,
  });
}

/** Zone-aware badge count, kept separate so the bell can poll it cheaply. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async ({ signal }) => {
      const result = await api.get<{ unreadCount?: number }>(
        `/notifications/unread-count?zone=${ZONE}`,
        { signal },
      );
      return result?.unreadCount ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled,
  });
}

function useFeedMutation<TArg>(request: (arg: TArg) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkNotificationRead() {
  return useFeedMutation((id: string) =>
    api.put(`/notifications/${id}/read`, {}),
  );
}

export function useMarkAllNotificationsRead() {
  return useFeedMutation(() => api.put('/notifications/read-all', {}));
}

export function useDeleteNotification() {
  return useFeedMutation((id: string) => api.delete(`/notifications/${id}`));
}

export function useClearAllNotifications() {
  return useFeedMutation(() => api.delete('/notifications/clear-all'));
}
