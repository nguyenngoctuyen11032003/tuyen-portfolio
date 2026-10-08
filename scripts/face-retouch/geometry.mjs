// Sculpts the raw avatar mesh towards Tuyền's real features (run before enhance-avatar):
//   node geometry.mjs <in.glb> <out.glb> [--scale 1]
// Edits are small, smooth displacements in a head-local frame (origin between the eyes, x along the
// eye line, z straight out of the face) so they survive the head's ~21° turn in the scan:
//   - nose: dorsum raised (higher, straighter bridge), tip brought forward a little
//   - eyes: sockets deepened slightly, brow ridge lifted (gives the lids a real shadow)
//   - cheeks: lower cheeks pulled in, jaw corner firmed (leaner face, less "doll")
//   - chin: brought forward a touch
// Vertex normals of every moved vertex are recomputed from the surrounding faces.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const [input, output] = args;
const scaleArg = args.indexOf('--scale');
const S = scaleArg >= 0 ? Number(args[scaleArg + 1]) : 1;
if (!input || !output) { console.error('Usage: node geometry.mjs <in.glb> <out.glb> [--scale k]'); process.exit(1); }

/* --------------------------------------------------------------- GLB I/O */
const buf = readFileSync(input);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
const binHeader = 20 + jsonLen;
const binLen = buf.readUInt32LE(binHeader);
const bin = buf.subarray(binHeader + 8, binHeader + 8 + binLen);
const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);

function floatAccessor(index) {
  const acc = json.accessors[index];
  const bv = json.bufferViews[acc.bufferView];
  if (acc.componentType !== 5126) throw new Error('expected float accessor');
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
  const start = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = bv.byteStride || comps * 4;
  const get = (i, c) => view.getFloat32(start + i * stride + c * 4, true);
  const set = (i, c, v) => view.setFloat32(start + i * stride + c * 4, v, true);
  return { count: acc.count, comps, get, set, acc };
}
function indexAccessor(index) {
  const acc = json.accessors[index];
  const bv = json.bufferViews[acc.bufferView];
  const start = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const get = acc.componentType === 5125 ? (i) => view.getUint32(start + i * 4, true) : (i) => view.getUint16(start + i * 2, true);
  return { count: acc.count, get };
}

const prim = json.meshes[0].primitives[0];
const POS = floatAccessor(prim.attributes.POSITION);
const NOR = floatAccessor(prim.attributes.NORMAL);
const IDX = indexAccessor(prim.indices);
const n = POS.count;
const P = new Float32Array(n * 3);
for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) P[i * 3 + c] = POS.get(i, c);

/* --------------------------------------------------------- head frame */
// Eye centres measured on the scan (world): right eye (viewer's right) and left eye.
const EYE_R = [0.0632, 0.8128, 0.0357];
const EYE_L = [-0.0091, 0.8125, 0.0082];
const O = EYE_R.map((v, i) => (v + EYE_L[i]) / 2);
const exRaw = [EYE_R[0] - EYE_L[0], 0, EYE_R[2] - EYE_L[2]];
const exLen = Math.hypot(exRaw[0], exRaw[2]);
const ex = [exRaw[0] / exLen, 0, exRaw[2] / exLen];
const ey = [0, 1, 0];
const ez = [-ex[2], 0, ex[0]]; // out of the face (towards +z, slightly -x)
const EYE_HALF = exLen / 2;
console.log(`head frame: origin ${O.map((v) => v.toFixed(4))}, turn ${(Math.atan2(ex[2], ex[0]) * 180 / Math.PI).toFixed(1)}°, eye half-distance ${(EYE_HALF * 1000).toFixed(1)} mm`);

const toLocal = (i) => {
  const dx = P[i * 3] - O[0], dy = P[i * 3 + 1] - O[1], dz = P[i * 3 + 2] - O[2];
  return [dx * ex[0] + dz * ex[2], dy, dx * ez[0] + dz * ez[2]];
};

/* ------------------------------------------------------------ helpers */
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
/** 1 inside [a, b], feathered to 0 over f on both sides. */
const win = (x, a, b, f) => smooth(a - f, a, x) * (1 - smooth(b, b + f, x));
const gauss = (x, s) => Math.exp(-(x * x) / (2 * s * s));

/* ------------------------------------------------------------- edits */
// Each returns a displacement [du, dv, dw] in mm for a local point, or null.
const EDITS = [
  // Nose: dorsum raised along the midline from the glabella down to the tip (tip is behind the cup).
  function nose([u, v, w]) {
    if (w < -0.005 || w > 0.035) return null; // face surface only (hand/cup are further out)
    const along = win(v, -0.040, 0.012, 0.012); // glabella (+0.012) to tip (-0.040)
    const profile = 0.45 + 0.55 * smooth(0.012, -0.030, v); // more lift towards the tip
    const across = gauss(u, 0.0085);
    const k = along * across * profile;
    return k ? [0, 0, 4.5 * k] : null;
  },
  // Eye sockets: a shallow dish around each eye, brow ridge lifted just above it.
  function sockets([u, v, w]) {
    if (w < -0.01 || w > 0.03) return null;
    let d = 0;
    for (const s of [-1, 1]) {
      const cu = s * EYE_HALF, du = (u - cu) / 0.019, dv = (v - 0.001) / 0.010;
      const r = Math.hypot(du, dv);
      d -= 1.6 * (1 - smooth(0.45, 1.0, r)); // dish
      const bu = (u - cu * 1.05) / 0.024, bv = (v - 0.019) / 0.006;
      d += 1.2 * (1 - smooth(0.5, 1.0, Math.hypot(bu, bv))); // brow ridge
    }
    return d ? [0, 0, d] : null;
  },
  // Cheeks: lower cheeks pulled towards the midline, strongest below the cheekbone.
  function cheeks([u, v, w]) {
    if (w < -0.035 || w > 0.04) return null;
    const side = Math.sign(u);
    const lateral = smooth(0.020, 0.058, Math.abs(u)) * (1 - smooth(0.070, 0.105, Math.abs(u)));
    const vertical = win(v, -0.070, -0.032, 0.028);
    const front = 1 - smooth(0.02, 0.04, w); // fade out before the mouth area
    const k = lateral * vertical * front;
    return k ? [-side * 2.2 * k, 0, -0.5 * k] : null;
  },
  // Chin: brought forward slightly (visible under the cup from the side).
  function chin([u, v, w]) {
    if (w < -0.01 || w > 0.05) return null;
    const k = gauss(u, 0.018) * win(v, -0.105, -0.075, 0.012) * smooth(0.0, 0.02, w);
    return k ? [0, -0.5 * k, 2.4 * k] : null;
  },
];

/* -------------------------------------------------------------- apply */
const moved = new Uint8Array(n);
let movedCount = 0, maxDisp = 0;
const head = { minY: O[1] - 0.14, maxY: O[1] + 0.06 };
for (let i = 0; i < n; i++) {
  const y = P[i * 3 + 1];
  if (y < head.minY || y > head.maxY) continue;
  const l = toLocal(i);
  if (Math.abs(l[0]) > 0.11) continue;
  let du = 0, dv = 0, dw = 0;
  for (const e of EDITS) { const d = e(l); if (d) { du += d[0]; dv += d[1]; dw += d[2]; } }
  if (!du && !dv && !dw) continue;
  du *= S / 1000; dv *= S / 1000; dw *= S / 1000;
  P[i * 3] += du * ex[0] + dw * ez[0];
  P[i * 3 + 1] += dv;
  P[i * 3 + 2] += du * ex[2] + dw * ez[2];
  moved[i] = 1; movedCount++;
  maxDisp = Math.max(maxDisp, Math.hypot(du, dv, dw));
}
console.log(`moved ${movedCount} vertices, max displacement ${(maxDisp * 1000).toFixed(2)} mm`);

// Recompute normals (area-weighted) for moved vertices.
const acc = new Float32Array(n * 3);
for (let t = 0; t < IDX.count; t += 3) {
  const a = IDX.get(t), b = IDX.get(t + 1), c = IDX.get(t + 2);
  if (!moved[a] && !moved[b] && !moved[c]) continue;
  const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
  const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az;
  const vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  for (const k of [a, b, c]) { acc[k * 3] += nx; acc[k * 3 + 1] += ny; acc[k * 3 + 2] += nz; }
}
for (let i = 0; i < n; i++) {
  if (!moved[i]) continue;
  const len = Math.hypot(acc[i * 3], acc[i * 3 + 1], acc[i * 3 + 2]);
  if (!len) continue;
  // Keep the original normal's orientation (the scan is double-sided, winding is not guaranteed).
  const dot = acc[i * 3] * NOR.get(i, 0) + acc[i * 3 + 1] * NOR.get(i, 1) + acc[i * 3 + 2] * NOR.get(i, 2);
  const sgn = dot < 0 ? -1 : 1;
  for (let c = 0; c < 3; c++) NOR.set(i, c, (sgn * acc[i * 3 + c]) / len);
  for (let c = 0; c < 3; c++) POS.set(i, c, P[i * 3 + c]);
}
// Accessor bounds must stay valid.
const pa = POS.acc;
if (pa.min && pa.max) {
  for (let c = 0; c < 3; c++) { pa.min[c] = Infinity; pa.max[c] = -Infinity; }
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { pa.min[c] = Math.min(pa.min[c], P[i * 3 + c]); pa.max[c] = Math.max(pa.max[c], P[i * 3 + c]); }
}

/* -------------------------------------------------------------- write */
const pad4 = (x) => (x + 3) & ~3;
let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad4(jsonBuf.length) - jsonBuf.length, 0x20)]);
const binOut = Buffer.concat([bin, Buffer.alloc(pad4(bin.length) - bin.length)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binOut.length, 8);
const chunk = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
writeFileSync(output, Buffer.concat([header, chunk(jsonBuf.length, 0x4e4f534a), jsonBuf, chunk(binOut.length, 0x004e4942), binOut]));
console.log('wrote', output);
