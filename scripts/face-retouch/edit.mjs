// Face retouch for the avatar, v2 (run from this folder):
//   node closeup.mjs <out> <yaw>            read pixel coordinates off a gridded unlit render
//   node edit.mjs <out> preview             before/after crops of every view
//   node edit.mjs <out> bake                writes <out>/basecolor-edited.jpg (2048² atlas)
// then: node geometry.mjs ../../public/3D_avatar.glb geo.glb
//       node ../enhance-avatar.mjs geo.glb out.glb --base <out>/basecolor-edited.jpg
// Image-space edits on unlit orthographic renders, baked back into the texture atlas. Towards
// Tuyền's real face (photos): narrow, heavy-lidded eyes with near-black irises and a soft lash
// shadow; dark-brown (not black) brows without the frown hook; natural shading in the eye
// sockets, down the sides of the nose and under the cheekbones so the face stops reading flat.
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { loadAvatar, rasterise, rotator } from './mesh.mjs';

const [out, mode] = process.argv.slice(2);
const SRC = process.env.GLB ?? 'D:/Code/Tuyen/tuyen-portfolio/public/3D_avatar.glb';
const m = await loadAvatar(SRC);
const SIZE = 1000;

/* -------------------------------------------------------------- helpers */
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const boxW = (x, y, b, f = 6) => {
  const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]);
  return 1 - smooth(0, f, Math.hypot(dx, dy));
};
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polyDist(x, y, poly) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    d = Math.min(d, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return d;
}
const polyW = (x, y, poly, f = 5) => (inPoly(x, y, poly) ? 1 : 1 - smooth(0, f, polyDist(x, y, poly)));
const polyBox = (poly, pad) => [Math.min(...poly.map((p) => p[0])) - pad, Math.min(...poly.map((p) => p[1])) - pad, Math.max(...poly.map((p) => p[0])) + pad, Math.max(...poly.map((p) => p[1])) + pad].map(Math.round);
/** Soft ellipse: 1 at the centre, 0 at the rim, with `f` controlling how early the fall-off starts (0..1). */
const ellipseW = (x, y, e) => {
  const c = Math.cos(e.rot ?? 0), s = Math.sin(e.rot ?? 0);
  const dx = x - e.cx, dy = y - e.cy;
  const u = (dx * c + dy * s) / e.rx, v = (-dx * s + dy * c) / e.ry;
  return 1 - smooth(e.f ?? 0.3, 1, Math.hypot(u, v));
};

function blur(img, w, h, r) {
  const tmp = new Float32Array(img.length), outp = new Float32Array(img.length);
  for (let y = 0; y < h; y++) for (let c = 0; c < 3; c++) {
    let acc = 0, n = 0;
    for (let x = -r; x < w + r; x++) {
      if (x + r < w) { acc += img[(y * w + x + r) * 3 + c]; n++; }
      if (x - r - 1 >= 0) { acc -= img[(y * w + x - r - 1) * 3 + c]; n--; }
      if (x >= 0 && x < w) tmp[(y * w + x) * 3 + c] = acc / n;
    }
  }
  for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let acc = 0, n = 0;
    for (let y = -r; y < h + r; y++) {
      if (y + r < h) { acc += tmp[((y + r) * w + x) * 3 + c]; n++; }
      if (y - r - 1 >= 0) { acc -= tmp[((y - r - 1) * w + x) * 3 + c]; n--; }
      if (y >= 0 && y < h) outp[(y * w + x) * 3 + c] = acc / n;
    }
  }
  return outp;
}

/* ------------------------------------------------------------------ views */
// Views are baked in order; the last one wins where they overlap, so the main front view goes last.
// Pixel coordinates were read off closeup-y*.png (1000 px = 0.2 m).
const VIEWS = [
  {
    // Skin clean-up only: the side of the nose bridge and the glabella are only seen from here.
    name: 'y45',
    yaw: 45,
    view: { size: SIZE, cx: 0.04, cy: 0.8, scale: SIZE / 0.2 },
    skin: [[[380, 160], [520, 160], [560, 320], [560, 450], [450, 495], [290, 545], [230, 700], [150, 880], [20, 880], [20, 420], [200, 390], [380, 300]]],
    brows: [], paint: [], clean: [], irises: [], lids: [], lash: [],
  },
  {
    // Turned so the eye behind the cup (viewer's left) is visible.
    name: 'y25',
    yaw: 25,
    view: { size: SIZE, cx: 0.04, cy: 0.8, scale: SIZE / 0.2 },
    brows: [],
    paint: [],
    clean: [],
    irises: [[205, 425, 330, 470]],
    lids: [{ x0: 200, x1: 335, top: 398, lid: 426, anchor: 470, amount: 9 }],
    lash: [{ box: [200, 400, 335, 470], above: 2, below: 7, strength: 0.55 }],
    skin: [[[500, 40], [720, 40], [820, 250], [850, 450], [840, 880], [760, 880], [735, 600], [660, 470], [200, 472], [150, 420], [150, 330], [300, 300], [440, 300]]],
  },
  {
    name: 'y-25',
    yaw: -25,
    view: { size: SIZE, cx: 0.04, cy: 0.8, scale: SIZE / 0.2 },
    brows: [],
    paint: [{ poly: [[318, 380], [316, 389], [309, 396], [300, 398], [291, 396], [284, 389], [282, 380], [284, 371], [291, 364], [300, 362], [309, 364], [316, 371]], from: [330, 400, 345, 412] }],
    clean: [],
    irises: [],
    lids: [],
    lash: [],
    skin: [[[300, 40], [640, 40], [760, 250], [850, 520], [870, 800], [820, 950], [600, 1000], [470, 1000], [450, 800], [410, 690], [400, 480], [300, 480], [210, 420], [210, 330]]],
  },
  {
    name: 'y0',
    yaw: 0,
    view: { size: SIZE, cx: 0.04, cy: 0.8, scale: SIZE / 0.2 },
    brows: [
      [[440, 345], [500, 300], [620, 284], [720, 300], [772, 330], [770, 345], [700, 330], [600, 326], [520, 345], [455, 372]],
      [[150, 350], [240, 330], [330, 345], [338, 368], [330, 392], [240, 382], [150, 398]],
    ],
    paint: [{ poly: [[350, 341], [374, 356], [398, 380], [398, 404], [350, 404], [338, 394], [331, 380], [332, 364], [340, 350]], from: [418, 392, 436, 404] }],
    clean: [[280, 290, 400, 345], [505, 378, 712, 420]],
    irises: [[535, 400, 660, 470]],
    lids: [{ x0: 500, x1: 715, top: 383, lid: 405, anchor: 462, amount: 15 }],
    lash: [{ box: [505, 385, 725, 475], above: 2, below: 8, strength: 0.6 }],
    skin: [[[400, 40], [720, 40], [860, 230], [900, 480], [890, 780], [600, 800], [585, 620], [540, 470], [430, 445], [170, 445], [160, 330], [300, 300], [400, 280]]],
  },
  // Eye repaints on 0.05 m close-ups (20 px per mm), baked last so they win. Each eye in the scan is
  // only ~40 x 15 texels of grey mush; it is redrawn as a crisp, high-contrast eye: black upper lash
  // line with an outer flick, dark-brown iris with pupil and limbal ring, clean sclera shaded under
  // the lid, a catch-light, a soft lower lash line and lid crease. Coordinates from
  // `node closeup.mjs <out> <yaw> <cx> <cy> 0.05 1000`.
  {
    // Viewer's-left eye (the one seen in the turned pose); outer corner on the left.
    name: 'eyeL',
    yaw: 50,
    view: { size: SIZE, cx: 0.0, cy: 0.81, scale: SIZE / 0.05 },
    brows: [], paint: [], clean: [], irises: [], lids: [], lash: [],
    skin: [[[80, 330], [940, 330], [940, 720], [80, 720]]],
    eyes: [{
      outer: 'left',
      upper: [[150, 528], [250, 512], [400, 482], [550, 462], [700, 468], [800, 482], [860, 490]],
      lower: [[150, 530], [300, 590], [450, 622], [600, 636], [720, 608], [820, 545], [860, 494]],
      iris: { cx: 648, cy: 548, rx: 108, ry: 124 },
      lash: 44, crease: 75,
    }],
  },
  {
    // Viewer's-right eye (front view); outer corner on the right.
    name: 'eyeR',
    yaw: 0,
    view: { size: SIZE, cx: 0.062, cy: 0.812, scale: SIZE / 0.05 },
    brows: [], paint: [], clean: [], irises: [], lids: [], lash: [],
    skin: [[[60, 260], [960, 260], [960, 720], [60, 720]]],
    eyes: [{
      outer: 'right',
      upper: [[110, 512], [180, 462], [300, 428], [500, 426], [700, 442], [830, 472], [900, 502]],
      lower: [[110, 516], [250, 576], [400, 596], [550, 590], [700, 566], [830, 536], [900, 506]],
      iris: { cx: 418, cy: 484, rx: 124, ry: 128 },
      lash: 44, crease: 90,
    }],
  },
];

/* ------------------------------------------------------------------ edit */
function editImage(R, v) {
  const E = Float32Array.from(R);
  const W = new Float32Array(SIZE * SIZE);
  const S = new Float32Array(SIZE * SIZE); // skin clean-up weight, baked into face-mask.png
  const ref = blur(R, SIZE, SIZE, 9);
  const px = (x, y) => (y * SIZE + x) * 3;
  const isSkinAt = (i) => sat(ref[i], ref[i + 1], ref[i + 2]) > 0.12 && lum(ref[i], ref[i + 1], ref[i + 2]) > 140 && ref[i] > ref[i + 2];
  const mark = (x, y, k) => { W[y * SIZE + x] = Math.max(W[y * SIZE + x], k); };

  // 0. Skin clean-up: inside the face regions, creases (frown lines, the nose-wing line), blotches
  // and light/dark seams are pulled towards a skin-only blur, and the rest of the skin is evened a
  // little. Features (lashes, brows, irises, sclera, hair, lips) are excluded by colour and dilated.
  if (v.skin.length) {
    const isSkin = (r, g, b) => r > b && sat(r, g, b) > 0.08 && lum(r, g, b) > 150;
    const isFeature = (r, g, b) => lum(r, g, b) < 80 || sat(r, g, b) < 0.07 || r <= b || r - g > 75;
    const M = new Float32Array(R.length), MR = new Float32Array(R.length), F = new Float32Array(R.length);
    for (let k = 0; k < SIZE * SIZE; k++) {
      const i = k * 3, s = isSkin(R[i], R[i + 1], R[i + 2]) ? 1 : 0, f = isFeature(R[i], R[i + 1], R[i + 2]) ? 1 : 0;
      for (let c = 0; c < 3; c++) { M[i + c] = s; MR[i + c] = R[i + c] * s; F[i + c] = f; }
    }
    // Small isolated dark marks (specks, crease fragments) are blemishes, not features.
    const seen = new Uint8Array(SIZE * SIZE);
    for (let k0 = 0; k0 < SIZE * SIZE; k0++) {
      if (seen[k0] || !F[k0 * 3]) continue;
      const comp = [k0]; seen[k0] = 1;
      for (let q = 0; q < comp.length; q++) {
        const k = comp[q], x = k % SIZE, y = (k / SIZE) | 0;
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
          const kk = ny * SIZE + nx;
          if (!seen[kk] && F[kk * 3]) { seen[kk] = 1; comp.push(kk); }
        }
      }
      if (comp.length < 250) for (const k of comp) for (let c = 0; c < 3; c++) F[k * 3 + c] = 0;
    }
    // Second pass: skin darker than its first-pass neighbourhood (the creases themselves) is left out
    // of the reference, so a wide crease does not pull the reference down with it.
    const bm1 = blur(M, SIZE, SIZE, 14), bmr1 = blur(MR, SIZE, SIZE, 14);
    for (let i = 0; i < M.length; i += 3) {
      if (!M[i] || bm1[i] < 0.05) continue;
      if (lum(R[i], R[i + 1], R[i + 2]) < lum(bmr1[i], bmr1[i + 1], bmr1[i + 2]) / bm1[i] - 6) for (let c = 0; c < 3; c++) { M[i + c] = 0; MR[i + c] = 0; }
    }
    const bm = blur(M, SIZE, SIZE, 20), bmr = blur(MR, SIZE, SIZE, 20), near = blur(F, SIZE, SIZE, 5);
    for (const poly of v.skin) {
      const b = polyBox(poly, 26);
      for (let y = Math.max(0, b[1]); y <= Math.min(SIZE - 1, b[3]); y++) for (let x = Math.max(0, b[0]); x <= Math.min(SIZE - 1, b[2]); x++) {
        const rw = polyW(x, y, poly, 25);
        const i = px(x, y);
        if (!rw || bm[i] < 0.25) continue;
        const keep = smooth(0.0, 0.12, near[i]); // 1 next to a feature
        const ref = [bmr[i] / bm[i], bmr[i + 1] / bm[i], bmr[i + 2] / bm[i]];
        const d = Math.abs(lum(ref[0], ref[1], ref[2]) - lum(E[i], E[i + 1], E[i + 2]));
        const k = rw * (1 - keep) * Math.max(0.4, smooth(3, 16, d));
        if (k <= 0.001) continue;
        for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + ref[c] * k;
        mark(x, y, k);
        S[y * SIZE + x] = Math.max(S[y * SIZE + x], rw * (1 - keep));
      }
    }
  }

  // 1. Lid lowering: vertical displacement, strongest at the upper lid, zero at ROI top and anchor.
  for (const L of v.lids) {
    for (let y = L.top; y <= L.anchor; y++) for (let x = L.x0; x <= L.x1; x++) {
      const t = (x - L.x0) / (L.x1 - L.x0);
      const along = Math.pow(Math.sin(Math.PI * t), 0.7); // 0 at the corners, broad in the middle
      const wy = y <= L.lid ? smooth(L.top, L.lid, y) : 1 - smooth(L.lid, L.anchor, y);
      const d = L.amount * along * wy;
      if (d < 0.05) continue;
      const sy = y - d, y0 = Math.floor(sy), f = sy - y0;
      for (let c = 0; c < 3; c++) E[px(x, y) + c] = R[px(x, y0) + c] * (1 - f) + R[px(x, y0 + 1) + c] * f;
      mark(x, y, 1);
    }
  }
  // 1b. Paint: the polygon is re-filled by diffusing the surrounding skin inwards (a smooth fill that
  // follows the local skin gradient instead of a flat patch). Known = skin pixels in a ring outside
  // the polygon; dark pixels outside (brow, hair) are ignored.
  for (const p of v.paint) {
    const b = polyBox(p.poly, 14);
    const w = b[2] - b[0] + 1, h = b[3] - b[1] + 1;
    const kind = new Uint8Array(w * h); // 0 excluded, 1 known skin, 2 fill
    const F = new Float32Array(w * h * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = b[0] + x, Y = b[1] + y, i = px(X, Y), k = y * w + x;
      const skin = sat(E[i], E[i + 1], E[i + 2]) > 0.12 && lum(E[i], E[i + 1], E[i + 2]) > 165 && E[i] > E[i + 2];
      kind[k] = polyW(X, Y, p.poly, 5) > 0.02 ? 2 : skin ? 1 : 0;
      for (let c = 0; c < 3; c++) F[k * 3 + c] = E[i + c];
    }
    // Seed the fill with the mean of the known ring, then relax.
    const mean = [0, 0, 0]; let cnt = 0;
    for (let k = 0; k < w * h; k++) if (kind[k] === 1) { cnt++; for (let c = 0; c < 3; c++) mean[c] += F[k * 3 + c]; }
    if (cnt) for (let k = 0; k < w * h; k++) if (kind[k] === 2) for (let c = 0; c < 3; c++) F[k * 3 + c] = mean[c] / cnt;
    for (let it = 0; it < 300; it++) for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const k = y * w + x;
      if (kind[k] !== 2) continue;
      let n = 0; const acc = [0, 0, 0];
      for (const kk of [k - 1, k + 1, k - w, k + w]) { if (kind[kk] === 0) continue; n++; for (let c = 0; c < 3; c++) acc[c] += F[kk * 3 + c]; }
      if (n) for (let c = 0; c < 3; c++) F[k * 3 + c] = acc[c] / n;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = b[0] + x, Y = b[1] + y, i = px(X, Y), k = y * w + x;
      const wt = polyW(X, Y, p.poly, 7);
      if (!wt) continue;
      for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - wt) + F[k * 3 + c] * wt;
      mark(X, Y, wt);
    }
  }
  // 2. Clean: darker-than-skin strokes in the ROIs become the local skin tone.
  for (const b of v.clean) for (let y = b[1] - 8; y <= b[3] + 8; y++) for (let x = b[0] - 8; x <= b[2] + 8; x++) {
    const bw = boxW(x, y, b, 8);
    if (!bw) continue;
    const i = px(x, y);
    const l = lum(E[i], E[i + 1], E[i + 2]), lr = lum(ref[i], ref[i + 1], ref[i + 2]);
    if (!isSkinAt(i)) continue;
    const k = bw * smooth(4, 22, lr - l);
    for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + ref[i + c] * k;
    if (k > 0) mark(x, y, k);
  }
  // 3. Brows: pure black -> very dark warm brown, keeping the soft edge.
  for (const poly of v.brows) { const b = polyBox(poly, 5); for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) {
    const i = px(x, y);
    const l = lum(E[i], E[i + 1], E[i + 2]);
    const k = polyW(x, y, poly, 4) * (1 - smooth(60, 150, l));
    if (!k) continue;
    const target = [l * 1.1 + 22, l * 0.95 + 15, l * 0.85 + 11];
    for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + target[c] * k;
    mark(x, y, k);
  } }
  // 4. Irises: neutral grey -> near-black warm brown (sclera and catch-lights kept).
  for (const b of v.irises) for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) {
    const i = px(x, y);
    const r = E[i], g = E[i + 1], bl = E[i + 2];
    const l = lum(r, g, bl), s = sat(r, g, bl);
    const k = boxW(x, y, b, 3) * (1 - smooth(0.1, 0.2, s)) * smooth(40, 65, l) * (1 - smooth(190, 215, l));
    if (!k) continue;
    const target = [l * 0.30 + 12, l * 0.24 + 8, l * 0.20 + 6];
    for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + target[c] * k;
    mark(x, y, k);
  }
  // 5. Lash shadow: below the (new) upper lash line the eyeball gets a soft shadow, the lash line
  // itself thickens a little upward. The lash line is the first dark pixel in each column.
  for (const L of v.lash) {
    const [x0, y0, x1, y1] = L.box;
    for (let x = x0; x <= x1; x++) {
      let yl = -1;
      for (let y = y0; y <= y1; y++) { const i = px(x, y); if (lum(E[i], E[i + 1], E[i + 2]) < 80 && !isSkinAt(i)) { yl = y; break; } }
      if (yl < 0) continue;
      const edge = boxW(x, yl, [x0 + 8, y0, x1 - 8, y1], 10); // fade at the corners
      for (let y = yl - L.above; y <= yl + L.below; y++) {
        if (y < y0 || y > y1) continue;
        const i = px(x, y);
        const l = lum(E[i], E[i + 1], E[i + 2]);
        if (l < 60) continue; // already lash
        const t = y < yl ? 0.7 : 1 - smooth(0, L.below, y - yl);
        const k = edge * L.strength * t;
        if (k <= 0) continue;
        const target = [l * 0.35 + 10, l * 0.3 + 7, l * 0.28 + 6];
        for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + target[c] * k;
        mark(x, y, k);
      }
    }
  }
  // 6. Eye repaint (eye views only). Bottom to top: lid crease, sclera shaded under the lid, iris
  // (pupil, brown, limbal ring), catch-lights, lower lash line, upper lash line with an outer flick.
  for (const e of v.eyes ?? []) {
    const poly = (pts, x) => {
      if (x <= pts[0][0]) return pts[0][1];
      for (let j = 1; j < pts.length; j++) if (x <= pts[j][0]) { const [ax, ay] = pts[j - 1], [bx, by] = pts[j]; return ay + ((by - ay) * (x - ax)) / (bx - ax); }
      return pts.at(-1)[1];
    };
    const curve = (pts, x) => { let s = 0; for (let d = -16; d <= 16; d += 4) s += poly(pts, x + d); return s / 9; }; // rounds the kinks
    const x0 = e.upper[0][0], x1 = e.upper.at(-1)[0], FLICK = 45;
    const { cx, cy, rx, ry } = e.iris;
    const ys = [...e.upper, ...e.lower].map((p) => p[1]);
    const by0 = Math.max(0, Math.min(...ys) - e.crease - 40), by1 = Math.min(SIZE - 1, Math.max(...ys) + 20);
    const lerp = (a, b, k) => a.map((av, c) => av + (b[c] - av) * k);
    const catches = [{ x: cx + rx * 0.3, y: cy - ry * 0.3, r: 20, k: 0.95 }, { x: cx - rx * 0.32, y: cy + ry * 0.38, r: 8, k: 0.45 }];
    for (const c of catches) c.y = Math.max(c.y, curve(e.upper, c.x) + c.r + 8);
    // Local skin tone (mean of the skin pixels around the eye) for clearing the old lash line.
    const skinMean = [0, 0, 0]; let ns = 0;
    for (let y = by0; y <= by1; y++) for (let x = Math.max(0, x0 - 60); x <= Math.min(SIZE - 1, x1 + 60); x++) {
      const i = px(x, y);
      if (E[i] > E[i + 2] && lum(E[i], E[i + 1], E[i + 2]) > 150 && sat(E[i], E[i + 1], E[i + 2]) > 0.1) { ns++; for (let c = 0; c < 3; c++) skinMean[c] += E[i + c]; }
    }
    for (let c = 0; c < 3; c++) skinMean[c] /= ns || 1;
    for (let x = Math.max(0, x0 - FLICK - 10); x <= Math.min(SIZE - 1, x1 + FLICK + 10); x++) {
      const inside = x >= x0 && x <= x1;
      const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
      const tt = e.outer === 'left' ? t : 1 - t; // 0 at the outer corner, 1 at the inner corner
      const beyond = e.outer === 'left' ? x0 - x : x - x1; // > 0 in the flick
      const uy = curve(e.upper, x), ly = curve(e.lower, x);
      const arch = Math.pow(Math.sin(Math.PI * t), 0.8);
      for (let y = by0; y <= by1; y++) {
        const i = px(x, y);
        let col = [E[i], E[i + 1], E[i + 2]], w = 0;
        if (x >= x0 - FLICK && x <= x1 + FLICK && ns) {
          const above = y < uy - 2 && y > uy - e.lash - 70, below = y > ly + 3 && y < ly + 45;
          const cw = (above || below) ? 1 - smooth(110, 160, lum(col[0], col[1], col[2])) : 0;
          if (cw > 0) { col = lerp(col, skinMean, cw); w = Math.max(w, cw); }
        }
        if (inside) {
          // Lid crease: a soft warm line following the lid.
          const cyy = uy - e.crease * (0.55 + 0.45 * arch);
          const cw = (1 - smooth(0, 9, Math.abs(y - cyy))) * arch * 0.5;
          if (cw > 0) { col = lerp(col, [col[0] * 0.8, col[1] * 0.73, col[2] * 0.7], cw); w = Math.max(w, cw); }
          // Opening.
          const open = smooth(-1.5, 1.5, y - uy) * smooth(-1.5, 1.5, ly - y);
          if (open > 0) {
            const lid = smooth(0, 55, y - uy);
            const corner = 0.8 + 0.2 * smooth(0, 0.15, Math.min(t, 1 - t));
            let eye = [224, 216, 208].map((c) => c * (0.55 + 0.45 * lid) * corner);
            eye = lerp(eye, [214, 188, 178], (1 - smooth(0, 14, ly - y)) * 0.55); // waterline
            const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
            if (d < 1.03) {
              let iris = d < 0.4 ? [8, 6, 5] : lerp([66, 42, 28], [24, 15, 11], Math.pow((d - 0.4) / 0.6, 1.2));
              iris = lerp(iris, [8, 6, 5], 1 - smooth(0.36, 0.46, d)); // soft pupil edge
              if (d >= 0.4) iris = iris.map((c) => c * (1 + 0.18 * smooth(cy, cy + ry, y)));
              iris = lerp(iris, [16, 11, 8], smooth(0.8, 1.0, d)); // limbal ring
              iris = iris.map((c) => c * (0.7 + 0.3 * lid));
              eye = lerp(eye, iris, 1 - smooth(0.97, 1.03, d));
            }
            for (const c of catches) eye = lerp(eye, [255, 253, 248], (1 - smooth(0.55, 1, Math.hypot(x - c.x, y - c.y) / c.r)) * c.k);
            col = lerp(col, eye, open);
            w = Math.max(w, open);
          }
          // Lower lash line, heavier towards the outer corner.
          const lw = (1 - smooth(2, 10, Math.abs(y - ly - 3))) * 0.45 * (1 - smooth(0.55, 0.95, tt));
          if (lw > 0) { col = lerp(col, [70, 48, 40], lw); w = Math.max(w, lw); }
        }
        // Upper lash line: thick over the iris, thin at the inner corner, flicking out past the outer.
        let lashY = uy, th = 0;
        if (inside) th = e.lash * (0.5 + 0.5 * smooth(0, 0.3, tt)) * (1 - 0.75 * smooth(0.7, 1, tt));
        else if (beyond > 0 && beyond <= FLICK) {
          const f = beyond / FLICK;
          lashY = curve(e.upper, e.outer === 'left' ? x0 : x1) - 12 * f;
          th = e.lash * 0.5 * (1 - f);
        }
        if (th > 1) {
          const lw = smooth(lashY - th - 3, lashY - th + 3, y) * (1 - smooth(lashY + 1, lashY + 5, y));
          if (lw > 0) { col = lerp(col, [16, 11, 9], lw); w = Math.max(w, lw); }
        }
        if (w > 0) { E[i] = col[0]; E[i + 1] = col[1]; E[i + 2] = col[2]; mark(x, y, Math.min(1, w * 1.5)); S[y * SIZE + x] = 1; }
      }
    }
  }
  return { E, W, S };
}

/* ------------------------------------------------------------------- run */
const results = [];
for (const v of VIEWS) {
  const rot = rotator(v.yaw, 0);
  const R = rasterise(m, rot, v.view);
  const { E, W, S } = editImage(Float32Array.from(R.img), v);
  results.push({ v, R, E, W, S });
  if (mode === 'preview') {
    const toBuf = (a) => Buffer.from(Uint8ClampedArray.from(a));
    const crop = { left: 120, top: 250, width: 800, height: 420 };
    const before = await sharp(toBuf(R.img), { raw: { width: SIZE, height: SIZE, channels: 3 } }).extract(crop).toBuffer();
    const after = await sharp(toBuf(E), { raw: { width: SIZE, height: SIZE, channels: 3 } }).extract(crop).toBuffer();
    await sharp({ create: { width: crop.width, height: crop.height * 2 + 10, channels: 3, background: '#000' } })
      .composite([{ input: before, raw: { width: crop.width, height: crop.height, channels: 3 }, left: 0, top: 0 },
                  { input: after, raw: { width: crop.width, height: crop.height, channels: 3 }, left: 0, top: crop.height + 10 }])
      .png().toFile(`${out}/edit-${v.name}.png`);
    console.log('preview', v.name);
  }
}

if (mode === 'bake') {
  const { tex, texW, texH, uv, idx } = m;
  const outTex = Float32Array.from(tex);
  const touched = new Uint8Array(texW * texH);
  const mask = new Uint8Array(texW * texH);
  for (const { R, E, W, S } of results) {
    const { P, depth, triId } = R;
    const visible = new Set();
    for (let k = 0; k < triId.length; k++) if (triId[k] >= 0 && W[k] > 0) visible.add(triId[k]);
    for (const t of visible) {
      const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
      const U = [uv[a * 2] * texW, uv[b * 2] * texW, uv[c * 2] * texW];
      const V = [uv[a * 2 + 1] * texH, uv[b * 2 + 1] * texH, uv[c * 2 + 1] * texH];
      const den = (V[1] - V[2]) * (U[0] - U[2]) + (U[2] - U[1]) * (V[0] - V[2]);
      if (Math.abs(den) < 1e-9) continue;
      const minX = Math.max(0, Math.floor(Math.min(...U)) - 1), maxX = Math.min(texW - 1, Math.ceil(Math.max(...U)) + 1);
      const minY = Math.max(0, Math.floor(Math.min(...V)) - 1), maxY = Math.min(texH - 1, Math.ceil(Math.max(...V)) + 1);
      for (let ty = minY; ty <= maxY; ty++) for (let tx = minX; tx <= maxX; tx++) {
        const sx = tx + 0.5, sy = ty + 0.5;
        let w0 = ((V[1] - V[2]) * (sx - U[2]) + (U[2] - U[1]) * (sy - V[2])) / den;
        let w1 = ((V[2] - V[0]) * (sx - U[2]) + (U[0] - U[2]) * (sy - V[2])) / den;
        let w2 = 1 - w0 - w1;
        if (w0 < -0.15 || w1 < -0.15 || w2 < -0.15) continue;
        w0 = Math.max(0, w0); w1 = Math.max(0, w1); w2 = Math.max(0, w2);
        const s = w0 + w1 + w2; w0 /= s; w1 /= s; w2 /= s;
        const ix = w0 * P[a * 3] + w1 * P[b * 3] + w2 * P[c * 3];
        const iy = w0 * P[a * 3 + 1] + w1 * P[b * 3 + 1] + w2 * P[c * 3 + 1];
        const iz = w0 * P[a * 3 + 2] + w1 * P[b * 3 + 2] + w2 * P[c * 3 + 2];
        const kx = Math.floor(ix), ky = Math.floor(iy);
        if (kx < 0 || ky < 0 || kx >= SIZE || ky >= SIZE) continue;
        const k = ky * SIZE + kx;
        if (iz < depth[k] - 0.002) continue;
        const wt = W[k];
        if (!wt) continue;
        const ti = (ty * texW + tx) * 3;
        for (let ch = 0; ch < 3; ch++) outTex[ti + ch] = outTex[ti + ch] * (1 - wt) + E[k * 3 + ch] * wt;
        touched[ty * texW + tx] = 1;
        mask[ty * texW + tx] = Math.max(mask[ty * texW + tx], Math.round(S[k] * 255));
      }
    }
  }
  let n = 0; for (const t of touched) n += t;
  console.log('texels edited', n);
  const jpeg = await sharp(Buffer.from(Uint8ClampedArray.from(outTex)), { raw: { width: texW, height: texH, channels: 3 } }).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
  writeFileSync(`${out}/basecolor-edited.jpg`, jpeg);
  await sharp(Buffer.from(mask), { raw: { width: texW, height: texH, channels: 1 } }).png().toFile(`${out}/face-mask.png`);
  console.log('wrote basecolor-edited.jpg');
}
