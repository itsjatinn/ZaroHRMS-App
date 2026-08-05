/**
 * The width this UI was laid out against. React Native sizes everything in
 * fixed dp — a 30px heading is 30px everywhere — and dp already normalises
 * across screen densities, so the native build looks the same on every phone.
 *
 * The web has no such normalisation. The CSS viewport width varies widely
 * between devices: ~320 on a small or display-scaled Android, 360 on most,
 * 390–430 on larger phones. Fixed sizes on a variable canvas is why the same
 * screen reads as "zoomed in" on a narrow phone and sparse on a wide one.
 */
const DESIGN_WIDTH = 390;

/** Above this we are on a tablet or desktop, where scaling up would be absurd. */
const PHONE_MAX = 600;

const DEVICE_WIDTH_VIEWPORT =
  'width=device-width, initial-scale=1, shrink-to-fit=no';

/**
 * Pins the layout viewport to DESIGN_WIDTH so the browser scales the page to
 * fit the device. Proportions then match on every screen — the same
 * consistency dp gives the native build.
 *
 * `user-scalable=no` is deliberately not set: pinch-zoom stays available.
 * Suppressing it is an accessibility failure, and iOS ignores it anyway.
 */
export function lockViewportToDesignWidth(): void {
  if (typeof document === 'undefined') return;

  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;

  /**
   * Width actually available to the page.
   *
   * screen.width alone is the whole display, and the page does not always own
   * it: split-screen, an in-app/WebView browser, a resized desktop window and
   * device emulation all hand the page less. Scaling the 390px layout up to
   * the display then makes it wider than the window — and because global.css
   * sets `overflow-x: hidden`, the excess is clipped outright rather than
   * panned, which is the UI "cropping" this is meant to prevent.
   *
   * innerWidth alone is no good either: once the viewport is pinned below it
   * reports DESIGN_WIDTH, so feeding it back in would drift on every
   * re-measure. Hence the narrower of the two, measured only while the
   * viewport is unpinned (see measureThenApply).
   */
  const availableWidth = () => {
    const screenWidth = window.screen?.width || 0;
    const windowWidth = window.innerWidth || 0;
    if (!screenWidth) return windowWidth || DESIGN_WIDTH;
    if (!windowWidth) return screenWidth;
    return Math.min(screenWidth, windowWidth);
  };

  const apply = () => {
    const deviceWidth = availableWidth();

    if (deviceWidth >= PHONE_MAX) {
      meta.setAttribute('content', DEVICE_WIDTH_VIEWPORT);
      return;
    }

    // The fit scale must be spelled out. `width=390` alone leaves
    // initial-scale up to the browser, and Android Chrome then renders the
    // 390px layout at 1:1 inside a narrower window — the page looks ~8%
    // zoomed-in, the spare 30px pans as horizontal scroll, and opening the
    // drawer in that state lets the whole page wander. Pinning initial-scale
    // (and minimum-scale, so the page cannot be left stuck zoomed out) makes
    // the layout exactly fill the screen. Zooming IN stays available —
    // maximum-scale is deliberately not set, for accessibility.
    const scale = (deviceWidth / DESIGN_WIDTH).toFixed(4);
    meta.setAttribute(
      'content',
      `width=${DESIGN_WIDTH}, initial-scale=${scale}, minimum-scale=${scale}, shrink-to-fit=no`,
    );
  };

  /**
   * Re-measure with the viewport unpinned, so innerWidth reports the real
   * window instead of the DESIGN_WIDTH we ourselves put there. The first call
   * can measure directly — +html.tsx ships `width=device-width`, so nothing
   * has pinned it yet.
   */
  const measureThenApply = () => {
    meta.setAttribute('content', DEVICE_WIDTH_VIEWPORT);
    // A frame, so the browser applies the reset before innerWidth is read.
    window.requestAnimationFrame(apply);
  };

  apply();
  // Portrait and landscape have different device widths, so a phone rotated
  // into landscape can cross PHONE_MAX and should get its real viewport back.
  window.addEventListener('orientationchange', measureThenApply);
  // Deliberately NOT listening to `resize`: setting the meta above itself
  // fires one, so re-measuring on it would drive a reset/apply loop.
}
