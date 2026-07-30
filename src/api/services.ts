import { useQuery } from '@tanstack/react-query';

import { api } from './client';

/**
 * Satellite services — the policy portal and the LMS. Both live in separate
 * applications, so the backend mints a short-lived HMAC-signed URL that the
 * satellite turns into its own session; there is no second login.
 *
 * Mirrors the web panel's src/utils/satelliteLaunch.ts and the
 * QuickLinksWidget's availability check
 * (backend/src/satellite-launch/satellite-launch.controller.ts).
 */

/** 'compliance' is the LMS — the module key the backend uses for it. */
export type SatelliteKey = 'policies' | 'compliance';

export type AvailableSatellite = {
  service: string;
  moduleKey: SatelliteKey;
  label: string;
};

export const serviceKeys = {
  available: () => ['services', 'available'] as const,
};

/**
 * Which satellites this user can launch right now — module enabled *and* a
 * healthy provisioned link. Used to disable a button rather than let it
 * dead-end on an org that was never connected.
 */
export function useAvailableSatellites(enabled = true) {
  return useQuery({
    queryKey: serviceKeys.available(),
    queryFn: async ({ signal }) => {
      const rows = await api.get<AvailableSatellite[]>('/services/available', {
        signal,
      });
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 5 * 60_000,
    enabled,
  });
}

/**
 * Mints the signed launch URL. The caller opens it with `Linking.openURL` —
 * the route can't be navigated to directly because the guard reads a Bearer
 * header, which a plain browser navigation would not carry.
 */
export async function launchSatellite(key: SatelliteKey): Promise<string> {
  const result = await api.get<{ url?: string }>(`/services/${key}/launch`);
  if (!result?.url) {
    throw new Error('The portal did not return a link. Please try again.');
  }
  return result.url;
}
