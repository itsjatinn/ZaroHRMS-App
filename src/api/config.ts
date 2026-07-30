import Constants from 'expo-constants';

// Where the Zaro HRMS NestJS backend lives. Set EXPO_PUBLIC_API_BASE_URL (in
// .env or the EAS build profile) for staging/production builds.
//
// Without it we fall back to the machine running the Expo dev server: a phone
// on the same Wi-Fi cannot reach "localhost", but it can reach the laptop's LAN
// IP, which Expo already tells us through `hostUri` (e.g. "192.168.1.5:8081").

/** Default port `nest start` binds to (backend/scripts/free-port.cjs 4000). */
const DEV_API_PORT = 4000;

function devServerHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Expo Go on older SDKs only exposes the packager host here.
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)
      ?.debuggerHost;
  const host = hostUri?.split(':')[0]?.trim();
  return host ? host : null;
}

function resolveApiBase(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured) return configured.replace(/\/+$/, '');

  const host = devServerHost();
  return `http://${host ?? 'localhost'}:${DEV_API_PORT}`;
}

export const API_BASE = resolveApiBase();

/** Nest is mounted under a global `api` prefix (backend/src/main.ts). */
export const API_URL = `${API_BASE}/api`;

/** True when the app is talking to a locally served backend over plain HTTP. */
export const IS_LOCAL_API = API_URL.startsWith('http://');

// Printed once on launch so the Metro logs show which backend the build
// resolved — the quickest way to catch a phone pointing at the wrong host.
if (__DEV__) console.log(`[api] base URL: ${API_URL}`);
