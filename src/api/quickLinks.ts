import { useQuery } from '@tanstack/react-query';

import { api } from './client';

/**
 * Org-published quick links — the same GET /org/quick-links feed the web
 * panel's Quick Links widget reads. HR curates the list once; both products
 * render it. Satellite entries (LMS, policies) carry no URL here — the app
 * already shows those as signed-launch tiles.
 */

export type OrgQuickLink = {
  appId: string;
  url: string;
  label?: string;
  badge?: string;
  /** Lucide icon name picked in the web editor's icon library. */
  icon?: string;
  /** Small uploaded icon as a data URI. */
  iconImage?: string;
  /** #rrggbb accent for the icon chip. */
  tint?: string;
};

function asQuickLinks(raw: unknown): OrgQuickLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (app): app is OrgQuickLink =>
      !!app &&
      typeof app === 'object' &&
      typeof (app as OrgQuickLink).appId === 'string' &&
      typeof (app as OrgQuickLink).url === 'string',
  );
}

export function useOrgQuickLinks(enabled = true) {
  return useQuery({
    queryKey: ['org', 'quick-links'] as const,
    queryFn: async ({ signal }) => {
      const data = await api.get<{ apps?: unknown }>('/org/quick-links', {
        signal,
      });
      return asQuickLinks(data?.apps);
    },
    staleTime: 60_000,
    enabled,
  });
}

/** One placement in the web dashboard's per-user home layout. */
type LayoutPlacement = string | { id?: string; config?: { apps?: unknown } };

/**
 * The employee's OWN pinned quick links — the ones they added to the Quick
 * Links widget on the web dashboard. They live inside the per-user home
 * layout (scope `employee.home`, widget id `connectedApps`), so the app digs
 * the widget's config out of the layout rather than needing a new endpoint.
 * An employee who never customised their dashboard has no layout — empty.
 */
export function useMyQuickLinks(enabled = true) {
  return useQuery({
    queryKey: ['me', 'quick-links'] as const,
    queryFn: async ({ signal }) => {
      const data = await api.get<{
        layout?: { columns?: LayoutPlacement[][] } | null;
      }>('/me/home-layout?scope=employee.home', { signal });
      for (const column of data?.layout?.columns ?? []) {
        if (!Array.isArray(column)) continue;
        for (const placement of column) {
          if (
            placement &&
            typeof placement === 'object' &&
            placement.id === 'connectedApps'
          ) {
            return asQuickLinks(placement.config?.apps);
          }
        }
      }
      return [] as OrgQuickLink[];
    },
    staleTime: 60_000,
    enabled,
  });
}
