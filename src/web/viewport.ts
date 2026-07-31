// Native has a viewport by definition — dp already normalises layout across
// screen densities, so there is nothing to correct. The web build resolves the
// sibling viewport.web.ts, which pins the layout viewport to the design width.
export function lockViewportToDesignWidth(): void {}
