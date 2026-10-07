import { describe, expect, it } from 'vitest';
import { content } from '../../data/content';
import { collectShots, depthAfterRotation, depthDim, fibonacciSphere, sphereMetrics } from './sphere';

describe('collectShots', () => {
  const shots = collectShots(content.vi.projects.items);
  const total = content.vi.projects.items.reduce((n, p) => n + (p.images?.length ?? 0), 0);

  it('includes every project screenshot exactly once, using thumbnails', () => {
    expect(shots).toHaveLength(total);
    expect(new Set(shots.map((s) => s.key)).size).toBe(total);
    for (const shot of shots) expect(shot.thumb).toMatch(/^\/projects\/thumbs\/.+\.webp$/);
  });

  it('deals shots round-robin so the first cards come from different projects', () => {
    const withImages = content.vi.projects.items.filter((p) => p.images?.length).length;
    const firstRound = shots.slice(0, withImages).map((s) => s.projectIndex);
    expect(new Set(firstRound).size).toBe(withImages);
  });

  it('marks portrait screenshots as tall', () => {
    expect(shots.find((s) => s.key === '/projects/gym-3.png')?.tall).toBe(true);
    expect(shots.find((s) => s.key === '/projects/crm-1.png')?.tall).toBe(false);
  });
});

describe('fibonacciSphere', () => {
  it('returns unit vectors from the top pole to the bottom pole', () => {
    const pts = fibonacciSphere(45);
    expect(pts).toHaveLength(45);
    expect(pts[0].y).toBeCloseTo(1);
    expect(pts[44].y).toBeCloseTo(-1);
    for (const p of pts) expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1);
  });
});

describe('sphereMetrics', () => {
  it('keeps the sphere inside the shorter viewport axis and shrinks cards as the count grows', () => {
    const desk = sphereMetrics(1440, 900, 45);
    expect(desk.radius).toBeLessThanOrEqual(900 * 0.44);
    expect(desk.cardWidth).toBeLessThan(sphereMetrics(1440, 900, 21).cardWidth);
    const phone = sphereMetrics(390, 844, 45);
    expect(phone.radius).toBeLessThanOrEqual(390 * 0.5);
    expect(phone.perspective).toBe(760);
  });
});

describe('depth shading', () => {
  const front = { x: 0, y: 0, z: 1, lat: 0, lon: 0 };

  it('reads depth after yaw: a front card goes to the back after half a turn', () => {
    expect(depthAfterRotation(front, 0, 0)).toBeCloseTo(1);
    expect(depthAfterRotation(front, 180, 0)).toBeCloseTo(-1);
    expect(depthAfterRotation(front, 90, 0)).toBeCloseTo(0);
  });

  it('darkens far cards more than near ones, and nothing once shading is off', () => {
    expect(depthDim(-1, 1)).toBeGreaterThan(depthDim(1, 1));
    expect(depthDim(1, 1)).toBeCloseTo(0);
    expect(depthDim(-1, 0)).toBe(0);
  });
});
