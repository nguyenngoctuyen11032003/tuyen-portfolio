/**
 * Starfield for the hero, drawn as two 1px elements whose stars are one long box-shadow list
 * (cheap: no canvas, no per-star nodes). Seeded so the sky is identical on every load.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starfield(seed: number, count: number, alpha: [number, number], tint?: (i: number) => boolean) {
  const rand = mulberry32(seed);
  const stars: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 100).toFixed(2);
    const a = (alpha[0] + rand() * (alpha[1] - alpha[0])).toFixed(2);
    const rgb = tint?.(i) ? '110,231,183' : '244,241,234';
    stars.push(`${x}vw ${y}vh 0 0 rgba(${rgb},${a})`);
  }
  return stars.join(',');
}

/** 150 faint pin-prick stars. */
export const STARS_A = starfield(20031103, 150, [0.16, 0.5]);
/** 18 brighter, slightly blurred stars; every fourth one is emerald. */
export const STARS_B = starfield(20250701, 18, [0.45, 0.8], (i) => i % 4 === 0);
