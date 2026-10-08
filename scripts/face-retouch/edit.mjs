// Face retouch for the avatar (run from this folder): node closeup.mjs <out> <yaw> to read pixel
// coordinates, node edit.mjs <out> preview to check the edits, node edit.mjs <out> bake to write
// basecolor-edited.jpg, then: node ../enhance-avatar.mjs ../../public/3D_avatar.glb <out.glb> --base <jpg>
// Image-space face edits on an unlit render, then baked back into the texture atlas.
//   node edit.mjs <outDir> preview   -> writes before/after crops of the edited render
//   node edit.mjs <outDir> bake <outGlb>
// Edits (all in the illustration's own style):
//   - iris: light grey -> dark warm brown (both eyes)
//   - brows: pure black -> very dark brown, inner "frown hook" + glabella wrinkles removed
//   - double-eyelid crease above the eye removed, upper lid lowered a little (narrower, monolid look)
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { loadAvatar, rasterise, rotator } from './mesh.mjs';

const [out, mode, outGlb] = process.argv.slice(2);
const SRC = 'D:/Code/Tuyen/tuyen-portfolio/public/3D_avatar.glb';
const m = await loadAvatar(SRC);
const SIZE = 1000;

/* -------------------------------------------------------------- helpers */
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const inBox = (x, y, b) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];
/** Feathered box weight: 1 inside, falling to 0 over `f` px outside. */
const boxW = (x, y, b, f = 6) => {
  const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]);
  return 1 - smooth(0, f, Math.hypot(dx, dy));
};

/** Point-in-polygon (even-odd). */
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** Distance from a point to a polygon's edges. */
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
/** Feathered polygon weight: 1 inside, falling to 0 over `f` px outside. */
const polyW = (x, y, poly, f = 5) => (inPoly(x, y, poly) ? 1 : 1 - smooth(0, f, polyDist(x, y, poly)));
const polyBox = (poly, pad) => [Math.min(...poly.map((p) => p[0])) - pad, Math.min(...poly.map((p) => p[1])) - pad, Math.max(...poly.map((p) => p[0])) + pad, Math.max(...poly.map((p) => p[1])) + pad];

/** Box blur of an RGB image (separable, radius r). */
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
// Each view: camera + the edits defined in its pixel space. Coordinates were read off closeup-y*.png.
const VIEWS = [
  {
    name: 'y0',
    yaw: 0,
    view: { size: SIZE, cx: 0.04, cy: 0.8, scale: SIZE / 0.2 },
    brows: [
      [[440, 345], [500, 300], [620, 284], [720, 300], [772, 330], [770, 345], [700, 330], [600, 326], [520, 345], [455, 372]],
      [[150, 350], [240, 330], [330, 345], [338, 368], [330, 392], [240, 382], [150, 398]],
    ],
    // Inner end of the left brow that hooks down into a frown: painted over with skin sampled at `from`.
    paint: [{ poly: [[350, 341], [374, 356], [398, 380], [398, 404], [350, 404], [338, 394], [331, 380], [332, 364], [340, 350]], from: [418, 392, 436, 404] }],
    // Glabella wrinkles and the double-eyelid crease above the right eye.
    clean: [[280, 290, 372, 340], [505, 378, 712, 402]],
    irises: [[535, 400, 660, 470], [185, 412, 310, 466]],
    // Upper lid lowered by up to `amount` px between x0..x1, anchored on the lower lid.
    lids: [{ x0: 500, x1: 712, top: 392, lid: 412, anchor: 456, amount: 7 }],
  },
  {
    // Turned the other way so the eye behind the cup at yaw 0 is visible.
    name: 'y-25',
    yaw: -25,
    view: { size: SIZE, cx: -0.0, cy: 0.8, scale: SIZE / 0.2 },
    brows: [],
    // Leftovers of the frown hook on an atlas island hidden at yaw 0.
    paint: [{ poly: [[318, 380], [316, 389], [309, 396], [300, 398], [291, 396], [284, 389], [282, 380], [284, 371], [291, 364], [300, 362], [309, 364], [316, 371]], from: [330, 400, 345, 412] }],
    clean: [],
    irises: 'auto',
    lids: [],
  },
  {
    name: 'y25',
    yaw: 25,
    view: { size: SIZE, cx: 0.04, cy: 0.8, scale: SIZE / 0.2 },
    brows: [],
    paint: [{ poly: [[438, 385], [436, 394], [429, 401], [420, 403], [411, 401], [404, 394], [402, 385], [404, 376], [411, 369], [420, 367], [429, 369], [436, 376]], from: [445, 405, 460, 417] }],
    clean: [],
    irises: [],
    lids: [],
  },
];

function editImage(R, v) {
  const E = new Float32Array(R.length);
  for (let i = 0; i < R.length; i++) E[i] = R[i];
  const W = new Float32Array(SIZE * SIZE); // edit weight
  const ref = blur(R, SIZE, SIZE, 9); // local skin reference for cleaning

  const px = (x, y) => (y * SIZE + x) * 3;

  // 1. Lid lowering: vertical displacement, strongest at the upper lid, zero at ROI top and anchor.
  for (const L of v.lids) {
    for (let y = L.top; y <= L.anchor; y++) for (let x = L.x0; x <= L.x1; x++) {
      const t = (x - L.x0) / (L.x1 - L.x0);
      const along = Math.sin(Math.PI * t); // 0 at the corners
      const wy = y <= L.lid ? smooth(L.top, L.lid, y) : 1 - smooth(L.lid, L.anchor, y);
      const d = L.amount * along * wy;
      if (d < 0.05) continue;
      const sy = y - d, y0 = Math.floor(sy), f = sy - y0;
      for (let c = 0; c < 3; c++) E[px(x, y) + c] = R[px(x, y0) + c] * (1 - f) + R[px(x, y0 + 1) + c] * f;
      W[y * SIZE + x] = Math.max(W[y * SIZE + x], 1);
    }
  }
  // 1b. Paint: fill a polygon with the median skin colour of a nearby patch.
  for (const p of v.paint) {
    const vals = [[], [], []];
    for (let y = p.from[1]; y <= p.from[3]; y++) for (let x = p.from[0]; x <= p.from[2]; x++) for (let c = 0; c < 3; c++) vals[c].push(R[px(x, y) + c]);
    const skin = vals.map((a) => a.sort((q, r) => q - r)[a.length >> 1]);
    const b = polyBox(p.poly, 6);
    for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) {
      const k = polyW(x, y, p.poly, 5);
      if (!k) continue;
      const i = px(x, y);
      for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + skin[c] * k;
      W[y * SIZE + x] = Math.max(W[y * SIZE + x], k);
    }
  }
  // 2. Clean: darker-than-skin strokes in the ROIs become the local skin tone.
  for (const b of v.clean) for (let y = b[1] - 8; y <= b[3] + 8; y++) for (let x = b[0] - 8; x <= b[2] + 8; x++) {
    const bw = boxW(x, y, b, 8);
    if (!bw) continue;
    const i = px(x, y);
    const l = lum(E[i], E[i + 1], E[i + 2]), lr = lum(ref[i], ref[i + 1], ref[i + 2]);
    const isSkin = sat(ref[i], ref[i + 1], ref[i + 2]) > 0.12 && lr > 140;
    if (!isSkin) continue;
    const k = bw * smooth(4, 22, lr - l);
    for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + ref[i + c] * k;
    if (k > 0) W[y * SIZE + x] = Math.max(W[y * SIZE + x], k);
  }
  // 3. Brows: pure black -> very dark warm brown, keeping the soft edge.
  for (const poly of v.brows) { const b = polyBox(poly, 5); for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) {
    const i = px(x, y);
    const l = lum(E[i], E[i + 1], E[i + 2]);
    const k = polyW(x, y, poly, 4) * (1 - smooth(60, 150, l));
    if (!k) continue;
    const target = [l * 1.1 + 22, l * 0.95 + 15, l * 0.85 + 11];
    for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + target[c] * k;
    W[y * SIZE + x] = Math.max(W[y * SIZE + x], k);
  } }
  // 4. Irises: neutral grey -> dark warm brown (sclera and catch-lights kept).
  const irisBoxes = v.irises === 'auto' ? [[0, 300, SIZE - 1, 560]] : v.irises;
  for (const b of irisBoxes) for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) {
    const i = px(x, y);
    const r = E[i], g = E[i + 1], bl = E[i + 2];
    const l = lum(r, g, bl), s = sat(r, g, bl);
    // Grey iris: low saturation, mid luminance. Skin (saturated) and hair (very dark) are skipped.
    const k = boxW(x, y, b, 3) * (1 - smooth(0.1, 0.2, s)) * smooth(45, 70, l) * (1 - smooth(175, 205, l));
    if (!k) continue;
    const target = [l * 0.42 + 16, l * 0.33 + 11, l * 0.27 + 8];
    for (let c = 0; c < 3; c++) E[i + c] = E[i + c] * (1 - k) + target[c] * k;
    W[y * SIZE + x] = Math.max(W[y * SIZE + x], k);
  }
  return { E, W };
}

/* ------------------------------------------------------------------ run */
const results = [];
for (const v of VIEWS) {
  const rot = rotator(v.yaw, 0);
  const R = rasterise(m, rot, v.view);
  const { E, W } = editImage(Float32Array.from(R.img), v);
  results.push({ v, R, E, W, rot });
  if (mode === 'preview') {
    const toBuf = (a) => Buffer.from(Uint8ClampedArray.from(a));
    const crop = { left: 120, top: 250, width: 680, height: 260 };
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
  // For every texel of every triangle visible in a view, blend in the edited colour by its weight.
  const { tex, texW, texH, uv, idx } = m;
  const outTex = Uint8ClampedArray.from(tex);
  const touched = new Uint8Array(texW * texH);
  for (const { v, R, E, W } of results) {
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
        // Accept texels up to ~1px outside the triangle (dilation into the island gutter).
        if (w0 < -0.15 || w1 < -0.15 || w2 < -0.15) continue;
        w0 = Math.max(0, w0); w1 = Math.max(0, w1); w2 = Math.max(0, w2);
        const s = w0 + w1 + w2; w0 /= s; w1 /= s; w2 /= s;
        const ix = w0 * P[a * 3] + w1 * P[b * 3] + w2 * P[c * 3];
        const iy = w0 * P[a * 3 + 1] + w1 * P[b * 3 + 1] + w2 * P[c * 3 + 1];
        const iz = w0 * P[a * 3 + 2] + w1 * P[b * 3 + 2] + w2 * P[c * 3 + 2];
        const kx = Math.floor(ix), ky = Math.floor(iy);
        if (kx < 0 || ky < 0 || kx >= SIZE || ky >= SIZE) continue;
        const k = ky * SIZE + kx;
        if (iz < depth[k] - 0.002) continue; // hidden behind something in this view
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
  const jpeg = await sharp(Buffer.from(outTex), { raw: { width: texW, height: texH, channels: 3 } }).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
  writeFileSync(`${out}/basecolor-edited.jpg`, jpeg);
  console.log('wrote basecolor-edited.jpg');
}
