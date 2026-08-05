import { getItem, removeItem, setItem } from '../../auth/secureStorage';

// Remembers that the "complete your profile" popup has already been shown for
// the current sign-in, so it appears once per session rather than once per app
// launch. A module-level flag cannot do this: the session outlives the JS
// module (a web reload or an app relaunch restores it from storage but starts
// the module fresh), which is exactly when the popup used to reappear.
//
// Cleared by AuthContext on sign-in and sign-out, so the next session — or a
// different account on the same device — gets the popup again.
const SHOWN_KEY = 'zaro.profilePopupShown';

// Mirrors the stored value so repeat checks within a session skip the async
// read. Storage stays the source of truth across reloads; this only avoids
// re-reading it every time the home screen remounts.
let shownInMemory = false;

export async function hasShownProfilePopup(): Promise<boolean> {
  if (shownInMemory) return true;
  try {
    const stored = (await getItem(SHOWN_KEY)) === '1';
    if (stored) shownInMemory = true;
    return stored;
  } catch {
    // Storage unavailable (private mode, sandboxed web): fall back to the
    // in-memory flag, which still holds the popup to once per launch.
    return shownInMemory;
  }
}

export async function markProfilePopupShown(): Promise<void> {
  shownInMemory = true;
  try {
    await setItem(SHOWN_KEY, '1');
  } catch {
    // Ignore; the in-memory flag still covers this launch.
  }
}

/** Called when a session starts or ends, so the next one shows it again. */
export async function clearProfilePopupLatch(): Promise<void> {
  shownInMemory = false;
  try {
    await removeItem(SHOWN_KEY);
  } catch {
    // Ignore; the in-memory reset above is what matters for this launch.
  }
}
