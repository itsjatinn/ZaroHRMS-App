/**
 * Wire shape for the `employee.profile.photo` user preference.
 *
 * The read and write shapes are deliberately asymmetric on the server, which
 * is easy to get wrong:
 *   - PUT  /user-preferences/:key  takes `{ value: <payload> }`
 *   - GET  /user-preferences/:key  returns `<payload>` directly
 *     (UserPreferencesService.getByKey ends in `pref?.value ?? null`)
 *
 * Clearing a photo writes a tombstone rather than deleting the row, so a
 * removed photo has to be recognised on read instead of arriving as null.
 *
 * Kept pure and dependency-free so it can be exercised without a React or
 * React Native runtime.
 */

export type PhotoPreference = {
  dataUrl?: string | null;
  removed?: boolean;
} | null;

/** Reads a GET response into the data URL to render, or null for none. */
export function readPhotoPreference(pref: PhotoPreference): string | null {
  if (pref?.removed) return null;
  // Only accept a real inline image: a stale or malformed value would
  // otherwise become a permanently broken <Image>.
  return typeof pref?.dataUrl === 'string' &&
    pref.dataUrl.startsWith('data:image/')
    ? pref.dataUrl
    : null;
}

/** Builds the PUT body for saving (data URL) or clearing (null). */
export function writePhotoPreference(dataUrl: string | null): {
  value: { dataUrl: string | null; removed?: boolean };
} {
  return {
    value: dataUrl ? { dataUrl } : { dataUrl: null, removed: true },
  };
}
