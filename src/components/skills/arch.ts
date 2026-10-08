/**
 * Positions for the core-stack tiles on the Skills arch, as CSS percentages of the arch box.
 *
 * The arch is a half-ellipse (x radius 44% of the width, y radius 72% of the height, base 8% up).
 * Spacing tiles by equal ANGLES bunches them where the ellipse runs near-vertical (its two ends),
 * so a tile sat on its neighbour's name. Spacing them by equal ARC LENGTH keeps every gap the same.
 *
 * @param count number of tiles
 * @param aspect the arch box's width / height (2.3 on desktop and tablet)
 */
export function archPositions(count: number, aspect = 2.3): { left: number; bottom: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ left: 50, bottom: 80 }];
  // Radii in units of the box width, so lengths along the curve are comparable on both axes.
  const a = 0.44;
  const b = 0.72 / aspect;
  const SAMPLES = 720;
  const lengths = [0];
  let prevX = -a;
  let prevY = 0;
  for (let s = 1; s <= SAMPLES; s++) {
    const t = Math.PI * (1 - s / SAMPLES);
    const x = Math.cos(t) * a;
    const y = Math.sin(t) * b;
    lengths.push(lengths[s - 1] + Math.hypot(x - prevX, y - prevY));
    prevX = x;
    prevY = y;
  }
  const total = lengths[SAMPLES];
  const out: { left: number; bottom: number }[] = [];
  let s = 0;
  for (let i = 0; i < count; i++) {
    const want = (total * i) / (count - 1);
    while (s < SAMPLES && lengths[s + 1] < want) s++;
    const span = lengths[s + 1] - lengths[s] || 1;
    const t = Math.PI * (1 - (s + Math.min(1, (want - lengths[s]) / span)) / SAMPLES);
    out.push({ left: 50 + Math.cos(t) * 44, bottom: 8 + Math.sin(t) * 72 });
  }
  return out;
}
