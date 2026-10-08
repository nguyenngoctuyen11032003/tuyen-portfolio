import type { ProjectItem } from '../../data/content';
import { aspectOf, thumbOf } from '../../data/thumbs';

export interface SphereShot {
  key: string;
  projectIndex: number;
  imageIndex: number;
  thumb: string;
  alt: string;
  tall: boolean;
}

export interface SpherePoint {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
}

const DEG = 180 / Math.PI;

/**
 * Every screenshot of every project, dealt round-robin (first shot of each project, then the
 * second, ...) so neighbouring cards on the sphere come from different projects.
 */
export function collectShots(projects: ProjectItem[]): SphereShot[] {
  const shots: SphereShot[] = [];
  const longest = Math.max(0, ...projects.map((p) => p.images?.length ?? 0));
  for (let round = 0; round < longest; round++) {
    projects.forEach((project, projectIndex) => {
      const image = project.images?.[round];
      if (!image) return;
      shots.push({
        key: image.src,
        projectIndex,
        imageIndex: round,
        thumb: thumbOf(image.src),
        alt: image.alt,
        tall: aspectOf(image.src) < 1,
      });
    });
  }
  return shots;
}

/** Evenly spread unit vectors on a sphere (Fibonacci lattice) with the yaw/pitch that faces each outward. */
export function fibonacciSphere(count: number): SpherePoint[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * golden;
    const x = Math.cos(theta) * rad;
    const z = Math.sin(theta) * rad;
    return { x, y, z, lat: Math.asin(y) * DEG, lon: Math.atan2(x, z) * DEG };
  });
}

export interface SphereMetrics {
  radius: number;
  cardWidth: number;
  perspective: number;
}

/** Radius from the shorter viewport axis; card width shrinks with the card count so they never overlap. */
export function sphereMetrics(width: number, height: number, count: number): SphereMetrics {
  const small = width <= 380;
  const phone = width <= 640;
  const hr = small ? 0.36 : phone ? 0.4 : 0.44;
  const wr = small ? 0.46 : phone ? 0.5 : 0.56;
  const floor = small ? 108 : phone ? 120 : 155;
  const radius = Math.max(floor, Math.min(470, height * hr, width * wr));
  const density = Math.sqrt(21 / Math.max(count, 21));
  const scale = (small ? 0.44 : phone ? 0.46 : 0.47) * density;
  const perspective = small ? 620 : phone ? 760 : width <= 900 ? 920 : 1150;
  return { radius, cardWidth: Math.round(Math.max(56, radius * scale)), perspective };
}

/**
 * Depth (-1 far .. 1 near the camera) of a sphere point after the world is rotated with
 * CSS `rotateY(yaw) rotateX(pitch)`. Card positions use CSS axes: y down, z toward the viewer.
 */
export function depthAfterRotation(point: SpherePoint, yawDeg: number, pitchDeg: number): number {
  const a = yawDeg / DEG;
  const b = pitchDeg / DEG;
  const y = -point.y;
  const zAfterPitch = y * Math.sin(b) + point.z * Math.cos(b);
  return -point.x * Math.sin(a) + zAfterPitch * Math.cos(a);
}

/**
 * Full position (unit sphere, CSS axes: x right, y down, z toward the viewer) of a point after
 * `rotateY(yaw) rotateX(pitch)`; `z` equals {@link depthAfterRotation}.
 */
export function rotatePoint(point: SpherePoint, yawDeg: number, pitchDeg: number) {
  const a = yawDeg / DEG;
  const b = pitchDeg / DEG;
  const y = -point.y;
  const yAfterPitch = y * Math.cos(b) - point.z * Math.sin(b);
  const zAfterPitch = y * Math.sin(b) + point.z * Math.cos(b);
  return {
    x: point.x * Math.cos(a) + zAfterPitch * Math.sin(a),
    y: yAfterPitch,
    z: -point.x * Math.sin(a) + zAfterPitch * Math.cos(a),
  };
}

/**
 * How much a front card overlaps the title at the sphere's centre (0 none .. 1 fully over it).
 * `halfW`/`halfH` are the title's half-size and `cardW`/`cardH` the card size, all in px; `R` is
 * the radius. Only cards on the near half count, ramping in so they fade rather than pop.
 */
export function titleOverlap(
  p: { x: number; y: number; z: number },
  R: number,
  halfW: number,
  halfH: number,
  cardW: number,
  cardH: number
): number {
  const front = Math.min(1, Math.max(0, (p.z - 0.15) / 0.35));
  if (!front) return 0;
  const ox = Math.min(1, Math.max(0, (halfW + cardW / 2 - Math.abs(p.x * R)) / (cardW * 0.6)));
  const oy = Math.min(1, Math.max(0, (halfH + cardH / 2 - Math.abs(p.y * R)) / (cardH * 0.6)));
  return front * ox * oy;
}

/** Opacity of the black wash over a card: far cards sink into the dark, near ones stay clear. */
export function depthDim(depth: number, shade: number): number {
  const base = 0.14 + 0.86 * Math.pow((depth + 1) / 2, 0.85);
  return shade * (1 - base);
}
