import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { api } from './client';

/**
 * Which HRMS modules this tenant has licensed — the same GET /tenant/me/modules
 * the web employee home gates its widgets with. Listing a disabled module's
 * cards or legend keys advertises states that can never appear.
 */

export const moduleKeys = {
  mine: () => ['tenant', 'me', 'modules'] as const,
};

export function useTenantModules(enabled = true) {
  return useQuery({
    queryKey: moduleKeys.mine(),
    queryFn: ({ signal }) =>
      api.get<{ modules?: string[] }>('/tenant/me/modules', { signal }),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export type ModuleGate = {
  /** Null while the list is loading — callers fail closed, like the web. */
  modules: Set<string> | null;
  has: (key: string) => boolean;
  attendanceOn: boolean;
  leaveOn: boolean;
};

/**
 * Convenience wrapper over the raw query. On the offline demo session there is
 * nothing to fetch, so every module reads as ON — the demo shows the full
 * product. On a live session the gate fails closed until the list resolves,
 * exactly as the web widget does, so cached data from a disabled module never
 * flashes in.
 */
export function useModuleGate(isBackendSession: boolean): ModuleGate {
  const query = useTenantModules(isBackendSession);

  return useMemo(() => {
    if (!isBackendSession) {
      const all = { has: () => true };
      return {
        modules: null,
        has: all.has,
        attendanceOn: true,
        leaveOn: true,
      };
    }
    const modules = Array.isArray(query.data?.modules)
      ? new Set(query.data.modules)
      : null;
    const has = (key: string) => modules?.has(key) ?? false;
    return {
      modules,
      has,
      attendanceOn: has('attendance'),
      leaveOn: has('leave'),
    };
  }, [isBackendSession, query.data]);
}
