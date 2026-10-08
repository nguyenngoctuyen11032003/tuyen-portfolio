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
    // Turned so the eye behind the cup (viewer's left) is visible.
    name: 'y25',
    yaw: 25,
    view: { size: SIZE, cx: 0.04, cy: 0.8, scale: SIZE / 0.2 },
    brows: [],
    paint: [{ poly: [[438, 385], [436, 394], [429, 401], [420, 403], [411, 401], [404, 394], [402, 385], [404, 376], [411, 369], [420, 367], [429, 369], [436, 376]], from: [445, 405, 460, 417] }],
    clean: [],
    irises: [[205, 425, 330, 470]],
    lids: [{ x0: 200, x1: 335, top: 398, lid: 426, anchor: 470, amount: 9 }],
    lash: [{ box: [200, 400, 335, 470], above: 2, below: 7, strength: 0.55 }],
    shade: [
      { kind: 'ellipse', cx: 268, cy: 436, rx: 95, ry: 42, rot: -0.12, f: 0.35, k: 0.90 }, // left socket
    ],
  },
  {
    name: 'y-25',
    yaw: -25,
    view: { size: SIZE, cx: -0.0, cy: 0.8, scale: SIZE / 0.2 },
    brows: [],
    paint: [{ poly: [[318, 380], [316, 389], [309, 396], [300, 398], [291, 396], [284, 389], [282, 380], [284, 371], [291, 364], [300, 362], [309, 364], [316, 371]], from: [330, 400, 345, 412] }],
    clean: [],
    irises: [],
    lids: [],
    lash: [],
    shade: [
      { kind: 'poly', poly: [[690, 480], [760, 500], [860, 560], [900, 640], [860, 700], [760, 640], [690, 560]], f: 30, k: 0.93 }, // under the right cheekbone
    ],
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
    clean: [[280, 290, 372, 340], [505, 378, 712, 420]],
    irises: [[535, 400, 660, 470]],
    lids: [{ x0: 500, x1: 715, top: 383, lid: 405, anchor: 462, amount: 15 }],
    lash: [{ box: [505, 385, 725, 475], above: 2, below: 8, strength: 0.6 }],
    shade: [
      { kind: 'ellipse', cx: 612, cy: 438, rx: 135, ry: 48, rot: 0.08, f: 0.35, k: 0.90 }, // right socket
      { kind: 'ellipse', cx: 255, cy: 440, rx: 95, ry: 42, rot: -0.1, f: 0.35, k: 0.92 }, // left socket (visible part)
      { kind: 'poly', poly: [[352, 395], [392, 395], [398, 450], [392, 520], [352, 520]], f: 22, k: 0.86 }, // nose, shadow side
      { kind: 'poly', poly: [[438, 400], [470, 400], [478, 460], [470, 520], [440, 520]], f: 22, k: 0.94 }, // nose, lit side
      { kind: 'poly', poly: [[600, 560], [700, 580], [840, 640], [880, 720], [820, 760], [700, 690], [600, 630]], f: 32, k: 0.93 }, // under the right cheekbone
      { kind: 'poly', poly: [[430, 300], [470, 300], [460, 380], [420, 380]], f: 24, k: 0.95 }, // glabella / between the brows
    ],
  },
];

/* ------------------------------------------------------------------ edit */
function editImage(R, v) {
  const E = Float32Array.from(R);
  const W = new Float32Array(SIZE * SIZE);
  const ref = blur(R, SIZE, SIZE, 9);
  const px = (x, y) => (y * SIZE + x) * 3;
  const isSkinAt = (i) => sat(ref[i], ref[i + 1], ref[i + 2]) > 0.12 && lum(ref[i], ref[i + 1], ref[i + 2]) > 140 && ref[i] > ref[i + 2];
  const mark = (x, y, k) => { W[y * SIZE + x] = Math.max(W[y * SIZE + x], k); };

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
  // 6. Shade: skin inside soft shapes is darkened (multiplied, slightly warmer) - painted form shadows.
  for (const s of v.shade) {
    const b = s.kind === 'ellipse'
      ? [Math.floor(s.cx - s.rx - 2), Math.floor(s.cy - s.ry - 2), Math.ceil(s.cx + s.rx + 2), Math.ceil(s.cy + s.ry + 2)]
      : polyBox(s.poly, s.f + 2);
    for (let y = Math.max(0, b[1]); y <= Math.min(SIZE - 1, b[3]); y++) for (let x = Math.max(0, b[0]); x <= Math.min(SIZE - 1, b[2]); x++) {
      const w = s.kind === 'ellipse' ? ellipseW(x, y, s) : polyW(x, y, s.poly, s.f);
      if (w <= 0.001) continue;
      const i = px(x, y);
      if (!(sat(E[i], E[i + 1], E[i + 2]) > 0.1 && lum(E[i], E[i + 1], E[i + 2]) > 120 && E[i] > E[i + 2])) continue;
      const mul = 1 - (1 - s.k) * w;
      E[i] *= mul; E[i + 1] *= mul * 0.985; E[i + 2] *= mul * 0.96; // warmer in the shadow
      mark(x, y, Math.min(1, w * 1.2));
    }
  }
  return { E, W };
}

/* ------------------------------------------------------------------- run */
const results = [];
for (const v of VIEWS) {
  const rot = rotator(v.yaw, 0);
  const R = rasterise(m, rot, v.view);
  const { E, W } = editImage(Float32Array.from(R.img), v);
  results.push({ v, R, E, W });
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
  for (const { R, E, W } of results) {
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
      }
    }
  }
  let n = 0; for (const t of touched) n += t;
  console.log('texels edited', n);
  const jpeg = await sharp(Buffer.from(Uint8ClampedArray.from(outTex)), { raw: { width: texW, height: texH, channels: 3 } }).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
  writeFileSync(`${out}/basecolor-edited.jpg`, jpeg);
  console.log('wrote basecolor-edited.jpg');
}
