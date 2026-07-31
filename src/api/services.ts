import { useQuery } from '@tanstack/react-query';

import { api } from './client';
import { API_BASE, IS_LOCAL_API } from './config';

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

const LOOPBACK = ['localhost', '127.0.0.1', '[::1]'];

/**
 * Points a dev launch URL at the machine running the services instead of the
 * phone.
 *
 * The backend mints the URL from the tenant's configured `baseUrl`, which is
 * `http://localhost:3001` in local development. On a device or emulator
 * "localhost" is that device itself, so the satellite is unreachable. The app
 * already resolves the dev machine's LAN address for its own API, so reuse
 * that host and keep the satellite's own port.
 *
 * Rewritten by string surgery on the authority segment rather than through
 * `new URL()`: React Native ships only a partial URL implementation, where the
 * `hostname` setter is a no-op — so the URL-based version silently returned
 * the original localhost address, which is exactly what reached the browser.
 *
 * Only applied when the app is itself talking to a local HTTP backend and the
 * URL is loopback; a real deployment hands back a proper domain, which must
 * pass through untouched. Everything after the authority (path, query,
 * fragment) is preserved byte for byte — the HMAC signature covers the claims
 * in the query string.
 */
export function resolveLaunchUrl(
  rawUrl: string,
  apiBase: string = API_BASE,
  isLocal: boolean = IS_LOCAL_API,
): string {
  if (!isLocal || !rawUrl) return rawUrl;

  const scheme = /^https?:\/\//i.exec(rawUrl);
  if (!scheme) return rawUrl;
  const afterScheme = rawUrl.slice(scheme[0].length);
  // The authority ends at the first '/', '?' or '#'.
  const authorityEnd = afterScheme.search(/[/?#]/);
  const authority =
    authorityEnd === -1 ? afterScheme : afterScheme.slice(0, authorityEnd);
  const rest = authorityEnd === -1 ? '' : afterScheme.slice(authorityEnd);

  // Split host from an optional :port, leaving any userinfo alone.
  const portMatch = /^(.*?)(:\d+)?$/.exec(authority);
  if (!portMatch) return rawUrl;
  const host = portMatch[1];
  const port = portMatch[2] ?? '';
  if (!LOOPBACK.includes(host.toLowerCase())) return rawUrl;

  // The dev machine's host, taken from the API base the app already resolved.
  const devHost = /^https?:\/\/([^/:?#]+)/i.exec(apiBase)?.[1];
  if (!devHost || LOOPBACK.includes(devHost.toLowerCase())) return rawUrl;

  return `${scheme[0]}${devHost}${port}${rest}`;
}

/**
 * Mints the signed launch URL. The caller opens it in a browser — the route
 * can't be navigated to directly because the guard reads a Bearer header,
 * which a plain browser navigation would not carry.
 */
export async function launchSatellite(key: SatelliteKey): Promise<string> {
  const result = await api.get<{ url?: string }>(`/services/${key}/launch`);
  if (!result?.url) {
    throw new Error('The portal did not return a link. Please try again.');
  }
  return resolveLaunchUrl(result.url);
}
