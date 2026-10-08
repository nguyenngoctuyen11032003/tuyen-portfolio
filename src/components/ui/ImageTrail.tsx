import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntroDone } from '../../context/IntroContext';
import trailImages from '../../data/trailImages.json';
import { STREAK_KEYFRAMES, TRAIL_DURATION, cardKeyframes, shuffled, spawnGap, tiltFor, trailSteps } from './trailMotion';

// Nothing spawns while the pointer is over something to read or click, or inside a dialog.
const QUIET = 'a, button, input, textarea, select, label, [data-shot], [role="button"], [role="dialog"], [data-no-trail]';
// Six cards per photo: with small cards the trail deals densely, so a fast sweep needs a deep pool
// to never recycle a card that is still on screen. Copies share a src, so nothing extra downloads.
const COPIES = 6;

/**
 * Cursor image trail: as the pointer travels, photos are dealt out evenly along its path. Each
 * one glides in from where the previous card landed, rests while the stack builds, then drops
 * away trailing light streaks. A fixed pool of pre-decoded cards is reused in turn and animated
 * with WAAPI on transform/opacity only, so it runs on the compositor. Only on devices with a
 * fine, hovering pointer, never with reduced motion, and not until the intro is done.
 */
export function ImageTrail() {
  const introDone = useIntroDone();
  const layerRef = useRef<HTMLDivElement>(null);
  const pool = useMemo(() => {
    const order = shuffled(trailImages);
    return Array.from({ length: order.length * COPIES }, (_, i) => order[i % order.length]);
  }, []);
  const [enabled] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const layer = layerRef.current;
    if (!enabled || !introDone || !layer) return;
    const cards = Array.from(layer.children) as HTMLDivElement[];
    const running = new Map<HTMLDivElement, Animation[]>();
    // Decode every photo up front: a card is only dealt once its bitmap is ready, so its first
    // appearance never waits on a decode mid-animation.
    const ready = cards.map(() => false);
    cards.forEach((card, i) => {
      card
        .querySelector('img')!
        .decode()
        .then(() => (ready[i] = true))
        .catch(() => {});
    });

    let mx = 0;
    let my = 0;
    let ax = 0;
    let ay = 0;
    let started = false;
    let quiet = false;
    let pressed = false;
    let next = 0;
    let z = 1;
    let raf = 0;
    let gap = spawnGap(cards[0].offsetWidth || 44);

    const deal = (fromX: number, fromY: number, x: number, y: number, ux: number) => {
      for (let tries = 0; tries < cards.length; tries++) {
        const i = next++ % cards.length;
        if (!ready[i]) continue;
        const card = cards[i];
        running.get(card)?.forEach((a) => a.cancel());
        card.style.zIndex = String(z++);
        const rot = tiltFor(ux, Math.random() * 2 - 1);
        const drop = 28 + Math.random() * 10;
        const timing: KeyframeAnimationOptions = { duration: TRAIL_DURATION, fill: 'both' };
        running.set(card, [
          card.animate(cardKeyframes(fromX, fromY, x, y, rot, drop), timing),
          card.lastElementChild!.animate(STREAK_KEYFRAMES, timing),
        ]);
        return;
      }
    };

    const tick = () => {
      raf = 0;
      if (quiet || pressed) {
        // Re-anchor, so leaving a link or ending a drag does not deal a burst for the jump.
        ax = mx;
        ay = my;
        return;
      }
      const { steps, x, y } = trailSteps(ax, ay, mx, my, gap);
      for (const s of steps) deal(s.fromX, s.fromY, s.x, s.y, s.ux);
      ax = x;
      ay = y;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      if (!started) {
        ax = mx;
        ay = my;
        started = true;
      }
      quiet = !!(e.target as Element).closest?.(QUIET);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };
    const onResize = () => {
      gap = spawnGap(cards[0].offsetWidth || 44);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', onResize);
      running.forEach((anims) => anims.forEach((a) => a.cancel()));
    };
  }, [enabled, introDone]);

  if (!enabled) return null;
  return (
    <div ref={layerRef} className="image-trail" aria-hidden="true">
      {pool.map((src, i) => (
        <div key={i} className="image-trail__card">
          {/* Loaded only once the intro is over, so the photos never compete with first paint. */}
          <img src={introDone ? src : undefined} alt="" draggable={false} />
          <span className="image-trail__streak" />
        </div>
      ))}
    </div>
  );
}
