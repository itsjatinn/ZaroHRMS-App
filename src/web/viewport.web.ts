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
   * Width actually available to the page, in device-width CSS pixels.
   *
   * Once the viewport is pinned, innerWidth reports DESIGN_WIDTH — feeding it
   * back in would drift on every re-measure. visualViewport sidesteps that:
   * `width × scale` is the window's physical CSS width regardless of what the
   * meta currently says, and the product is also invariant under pinch-zoom
   * (zooming shrinks width and raises scale in exact proportion), so a zoomed
   * page never triggers a bogus re-pin.
   *
   * screen.width alone is the whole display, and the page does not always own
   * it: split-screen, an in-app/WebView browser, a resized desktop window and
   * device emulation all hand the page less. Scaling the 390px layout up to
   * the display then makes it wider than the window — and because global.css
   * sets `overflow-x: hidden`, the excess is clipped outright rather than
   * panned, which is the UI "cropping" this is meant to prevent.
   */
  const availableWidth = () => {
    const visual = window.visualViewport;
    if (visual?.width && visual.scale) {
      return Math.round(visual.width * visual.scale);
    }
    const screenWidth = window.screen?.width || 0;
    const windowWidth = window.innerWidth || 0;
    if (!screenWidth) return windowWidth || DESIGN_WIDTH;
    if (!windowWidth) return screenWidth;
    return Math.min(screenWidth, windowWidth);
  };

  const apply = () => {
    const deviceWidth = availableWidth();

    const content =
      deviceWidth >= PHONE_MAX
        ? DEVICE_WIDTH_VIEWPORT
        : // The fit scale must be spelled out. `width=390` alone leaves
          // initial-scale up to the browser, and Android Chrome then renders
          // the 390px layout at 1:1 inside a narrower window — the page looks
          // ~8% zoomed-in, the spare 30px pans as horizontal scroll, and
          // opening the drawer in that state lets the whole page wander.
          // Pinning initial-scale (and minimum-scale, so the page cannot be
          // left stuck zoomed out) makes the layout exactly fill the screen.
          // Zooming IN stays available — maximum-scale is deliberately not
          // set, for accessibility.
          `width=${DESIGN_WIDTH}, initial-scale=${(deviceWidth / DESIGN_WIDTH).toFixed(4)}, minimum-scale=${(deviceWidth / DESIGN_WIDTH).toFixed(4)}, shrink-to-fit=no`;

    // Only write on change. Writing the meta fires a resize event of its own;
    // skipping identical writes is what stops that echo from looping — the
    // echoed resize re-measures, computes the same content, and goes quiet.
    if (meta.getAttribute('content') !== content) {
      meta.setAttribute('content', content);
    }
  };

  apply();
  // The available width is not fixed at load: rotation, split-screen,
  // foldables, desktop window resizes and keyboards all change it after the
  // fact. A stale minimum-scale from a wider window kept the 390px layout
  // wider than the screen, and overflow-x:hidden cropped every page on the
  // right. Debounced so mid-drag resize floods settle into one re-pin.
  let settle: ReturnType<typeof setTimeout> | undefined;
  const reapply = () => {
    if (settle) clearTimeout(settle);
    settle = setTimeout(apply, 120);
  };
  window.addEventListener('resize', reapply);
  window.addEventListener('orientationchange', reapply);
}
