/**
 * Scroll choreography for the Skills section: a pinned stage scrubbed over SCROLL_LENGTH px.
 * Ported from a "cinematic city scroll" layout; every frame is a pure function of the smoothed
 * scroll distance and pointer position, so it can be unit-tested without a browser.
 *
 *   0–650     giant title rises and fades, intro copy sinks
 *   560–1620  core-stack arch widens and launches up, foreground slabs part, panel 1 fades in
 *   1760–2700 panel 2 (security) fades in, the floor grid saturates
 *   2760–3560 skill-group slider flies in from the right
 *   3360–3660 slider controls fade in and become clickable
 */

/** Scrubbed distance; the section is 100vh + this tall. The tail after 3660 is a short hold. */
export const SCROLL_LENGTH = 4100;

/** Scroll distances worth jumping to when keyboard focus lands on something inside the stage. */
export const FOCUS_STOPS = { stack: 1100, security: 2340, slider: 3700 } as const;

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function smoothstep(e0: number, e1: number, v: number): number {
  const x = clamp((v - e0) / (e1 - e0));
  return x * x * (3 - 2 * x);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function segmentInOut(s: number, a: number, b: number, c: number, d: number) {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
}

const f = (n: number, digits = 4) => n.toFixed(digits);

export interface Frame {
  vars: Record<string, string>;
  controlsReady: boolean;
}

/**
 * The element(s) inside the section that read each custom property. Writing them all on the
 * section would restyle its whole subtree every frame; writing each where it is used keeps a frame
 * down to a handful of layers. Defaults for all of them live on `.tech` in skills.css.
 */
export const VAR_TARGETS: Record<string, string> = {
  '--sky-opacity': '.tech-sky',
  '--back-opacity': '.tech-back',
  '--back-x': '.tech-back',
  '--back-y': '.tech-back',
  '--back-scale': '.tech-back',
  '--glow-y': '.tech-glow',
  '--glow-scale': '.tech-glow',
  '--glow-opacity': '.tech-glow',
  '--grid-y': '.tech-grid',
  '--grid-sharp-opacity': '.tech-grid',
  '--grid-soft-opacity': '.tech-grid',
  '--shade-opacity': '.tech-shade',
  '--title-y': '.tech-title',
  '--title-scale': '.tech-title',
  '--title-opacity': '.tech-title',
  '--arch-x': '.tech-arch',
  '--arch-y': '.tech-arch',
  '--arch-scale': '.tech-arch',
  '--arch-opacity': '.tech-arch',
  '--split-left-x': '.tech-slab-left',
  '--split-right-x': '.tech-slab-right',
  '--split-y': '.tech-slab',
  '--split-scale': '.tech-slab',
  '--core-opacity': '.tech-core',
  '--core-x': '.tech-core',
  '--core-y': '.tech-core',
  '--core-scale': '.tech-core',
  '--intro-y': '.tech-intro',
  '--intro-opacity': '.tech-intro',
  '--panel2-opacity': '.tech-panel-stack',
  '--panel2-y': '.tech-panel-stack',
  '--panel3-opacity': '.tech-panel-security',
  '--panel3-y': '.tech-panel-security',
  '--panel3-pe': '.tech-panel-security',
  '--slider-enter-x': '.tech-slider',
  '--slider-opacity': '.tech-slider',
  '--slider-pe': '.tech-slider',
  '--slider-top': '.tech-slider, .tech-controls',
  '--controls-opacity': '.tech-controls',
};

/**
 * CSS custom properties for one frame. Only transforms and opacities move (no animated blur,
 * filter, gradient or box size), so the stage scrubs on the compositor without repaints.
 * @param scroll smoothed scroll distance into the section (0..SCROLL_LENGTH)
 * @param mx pointer x, -0.5..0.5 (0 under reduced motion)
 * @param my pointer y, -0.5..0.5
 * @param vh viewport height in px
 * @param archH laid-out height of the core arch in px (its box stays put; it scales instead)
 */
export function computeFrame(scroll: number, mx: number, my: number, vh: number, archH = 0): Frame {
  const frame2 = segmentInOut(scroll, 560, 900, 1300, 1620);
  const frame3 = segmentInOut(scroll, 1760, 2140, 2540, 2700);
  const progress = clamp(scroll / 2700);
  const introExit = smoothstep(90, 650, scroll);
  const sightsEnter = Math.pow(smoothstep(2760, 3560, scroll), 1.55);
  const controlsEnter = smoothstep(3360, 3660, scroll);
  const dimActive = clamp(frame2.active + frame3.active);
  const splitDrift = Math.pow(frame2.enter, 1.5);
  const panel2 = frame2.active * (1 - frame2.exit);
  const panel3 = frame3.active * (1 - frame3.exit);
  const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
  const heroY = progress * -74;
  const heroScale = progress * 0.23;
  const sliderTop = Math.max(96, (vh - 236) / 2 - 40);
  const splitY = `${f(my * 10 + heroY - splitDrift * 180, 2)}px`;
  const splitScale = f(1 + heroScale + frame2.enter * 0.74);
  const pe = (o: number) => (o > 0.6 ? 'auto' : 'none');

  // Over the black stage, dimming a layer is the same as lowering its opacity.
  const backBrightness = 1 - dimActive * 0.255;
  // The floor grid crossfades to a pre-blurred copy while panel 1 is up, and brightens
  // (0.8 -> 1) as the security panel arrives.
  const gridLevel = (1 - frame2.active * 0.255 - frame3.active * 0.06) * (0.8 + frame3.active * 0.2);
  // The arch widens by `grow`. Scale it rather than resizing its box, shifted so it still grows up
  // from its bottom edge (the origin is 48% down) while that edge sinks 13vh.
  const grow = (67.2 + frame2.enter * 37.8) / 67.2;
  const archShift = (frame2.enter * 13 * vh) / 100 - 0.52 * archH * (grow - 1);

  return {
    controlsReady: controlsEnter > 0.98,
    vars: {
      '--sky-opacity': f(backBrightness),
      '--back-opacity': f(1 - frame2.active * 0.06),
      '--back-x': `${f(mx * -12, 2)}px`,
      '--back-y': `${f(my * -4, 2)}px`,
      '--back-scale': f(backScale),
      '--glow-y': `${f(10 + progress * 10, 3)}vh`,
      '--glow-scale': f(0.78 + progress * 0.16),
      '--glow-opacity': f(0.72 * backBrightness),
      '--grid-y': `${f(20 - progress * 8, 3)}vh`,
      '--grid-sharp-opacity': f(gridLevel * (1 - frame2.active)),
      '--grid-soft-opacity': f(gridLevel * frame2.active),
      '--shade-opacity': f(dimActive),

      '--title-y': `${f(introExit * -210, 2)}px`,
      '--title-scale': f(1 - introExit * 0.08),
      '--title-opacity': f(1 - introExit),

      '--arch-x': `calc(-50% + ${f(mx * 18, 2)}px)`,
      '--arch-y': `${f(my * 8 + heroY - frame2.exit * 760 + archShift, 2)}px`,
      '--arch-scale': f((1.02 + heroScale + frame2.exit * 0.46) * grow),
      // Fully gone once it launches out: on tall screens it parks in view at the top otherwise.
      '--arch-opacity': f((1 - frame2.enter * 0.88) * (1 - frame2.exit)),

      '--split-left-x': `calc(-50% + ${f(-splitDrift * 46, 3)}vw + ${f(mx * 22, 2)}px)`,
      '--split-right-x': `calc(-50% + ${f(splitDrift * 46, 3)}vw + ${f(mx * 22, 2)}px)`,
      '--split-y': splitY,
      '--split-scale': splitScale,

      '--core-opacity': f(frame2.active * (1 - frame3.enter)),
      '--core-x': `calc(-50% + ${f(mx * 10, 2)}px)`,
      '--core-y': `calc(-50% + ${f(my * 8 - frame2.exit * 150, 2)}px)`,
      '--core-scale': f(1.06 + frame2.enter * 0.08 + frame2.exit * 0.08),

      '--intro-y': `${f(introExit * 90, 2)}px`,
      '--intro-opacity': f(1 - introExit),
      '--panel2-opacity': f(panel2),
      '--panel2-y': `calc(-50% + ${f(-frame2.exit * 86 + (1 - frame2.enter) * 58, 2)}px)`,
      '--panel3-opacity': f(panel3),
      '--panel3-y': `calc(-50% + ${f(-frame3.exit * 86 + (1 - frame3.enter) * 58, 2)}px)`,
      '--panel3-pe': pe(panel3),

      '--slider-enter-x': `${f((1 - sightsEnter) * 420, 3)}vw`,
      '--slider-opacity': sightsEnter > 0.01 ? '1' : '0',
      '--slider-pe': pe(sightsEnter),
      '--slider-top': `${f(sliderTop, 2)}px`,
      '--controls-opacity': f(controlsEnter),
    },
  };
}
