// Web has no keychain equivalent, so auth state persists in localStorage.
//
// SECURITY NOTE: localStorage is readable by any script on the page, so it is
// not a secure vault. For production web, prefer that the backend set the
// session as an httpOnly, Secure, SameSite cookie the browser sends
// automatically — then no token needs to live in JS at all. This adapter keeps
// the app functional on web today; swap it for the cookie flow when the real
// HRMS auth is wired in.

function available(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // localStorage can throw in private-mode / sandboxed contexts.
  }
  return null;
}

export async function getItem(key: string): Promise<string | null> {
  return available()?.getItem(key) ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  available()?.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  available()?.removeItem(key);
}
