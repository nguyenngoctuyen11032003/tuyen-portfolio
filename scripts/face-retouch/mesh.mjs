// Shared helpers: read the raw avatar GLB (float accessors) and a tiny software rasteriser.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

export function readGlb(path) {
  const buf = readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binHeader = 20 + jsonLen;
  const bin = buf.subarray(binHeader + 8, binHeader + 8 + buf.readUInt32LE(binHeader));
  return { json, bin };
}

function accessor(json, bin, index) {
  const acc = json.accessors[index];
  const bv = json.bufferViews[acc.bufferView];
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type];
  const start = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = bv.byteStride ?? 0;
  const Ctor = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[acc.componentType];
  if (!Ctor) throw new Error('unsupported componentType ' + acc.componentType);
  const elemBytes = Ctor.BYTES_PER_ELEMENT * comps;
  const out = new Ctor(acc.count * comps);
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  for (let i = 0; i < acc.count; i++) {
    const base = start + i * (stride || elemBytes);
    for (let c = 0; c < comps; c++) {
      const o = base + c * Ctor.BYTES_PER_ELEMENT;
      out[i * comps + c] = Ctor === Float32Array ? view.getFloat32(o, true) : Ctor === Uint32Array ? view.getUint32(o, true) : view.getUint16(o, true);
    }
  }
  return out;
}

export async function loadAvatar(path) {
  const { json, bin } = readGlb(path);
  const prim = json.meshes[0].primitives[0];
  const pos = accessor(json, bin, prim.attributes.POSITION);
  const uv = accessor(json, bin, prim.attributes.TEXCOORD_0);
  const idx = accessor(json, bin, prim.indices);
  const mat = json.materials[0];
  const img = json.images[json.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source];
  const bv = json.bufferViews[img.bufferView];
  const jpeg = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
  const tex = await sharp(jpeg).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { json, bin, pos, uv, idx, tex: tex.data, texW: tex.info.width, texH: tex.info.height, baseImageBufferView: img.bufferView };
}

/** Rotation about Y by yaw then X by pitch (degrees), applied to a point. */
export function rotator(yawDeg, pitchDeg) {
  const a = (yawDeg * Math.PI) / 180, b = (pitchDeg * Math.PI) / 180;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  return (x, y, z) => {
    const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
    const y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
    return [x1, y2, z2];
  };
}

/**
 * Orthographic camera looking down -Z at the rotated head. `view` = { cx, cy, scale, size } maps
 * world x/y to pixels: px = size/2 + (x - cx) * scale, py = size/2 - (y - cy) * scale.
 * Returns albedo image (RGB), depth buffer (larger z = nearer) and triangle-id buffer.
 */
export function rasterise(m, rot, view, triFilter = null) {
  const { size, cx, cy, scale } = view;
  const img = new Uint8Array(size * size * 3).fill(26);
  const depth = new Float32Array(size * size).fill(-Infinity);
  const triId = new Int32Array(size * size).fill(-1);
  const P = new Float32Array((m.pos.length / 3) * 3);
  for (let i = 0; i < m.pos.length / 3; i++) {
    const [x, y, z] = rot(m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]);
    P[i * 3] = size / 2 + (x - cx) * scale;
    P[i * 3 + 1] = size / 2 - (y - cy) * scale;
    P[i * 3 + 2] = z;
  }
  const { tex, texW, texH, uv } = m;
  for (let t = 0; t < m.idx.length / 3; t++) {
    if (triFilter && !triFilter(t)) continue;
    const a = m.idx[t * 3], b = m.idx[t * 3 + 1], c = m.idx[t * 3 + 2];
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const bx = P[b * 3], by = P[b * 3 + 1], bz = P[b * 3 + 2];
    const cxp = P[c * 3], cyp = P[c * 3 + 1], cz = P[c * 3 + 2];
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cxp))), maxX = Math.min(size - 1, Math.ceil(Math.max(ax, bx, cxp)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cyp))), maxY = Math.min(size - 1, Math.ceil(Math.max(ay, by, cyp)));
    if (minX > maxX || minY > maxY) continue;
    const den = (by - cyp) * (ax - cxp) + (cxp - bx) * (ay - cyp);
    if (Math.abs(den) < 1e-9) continue;
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const sx = px + 0.5, sy = py + 0.5;
        const w0 = ((by - cyp) * (sx - cxp) + (cxp - bx) * (sy - cyp)) / den;
        const w1 = ((cyp - ay) * (sx - cxp) + (ax - cxp) * (sy - cyp)) / den;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * az + w1 * bz + w2 * cz;
        const k = py * size + px;
        if (z <= depth[k]) continue;
        depth[k] = z;
        triId[k] = t;
        const u = w0 * uv[a * 2] + w1 * uv[b * 2] + w2 * uv[c * 2];
        const v = w0 * uv[a * 2 + 1] + w1 * uv[b * 2 + 1] + w2 * uv[c * 2 + 1];
        const tx = Math.min(texW - 1, Math.max(0, Math.floor(u * texW)));
        const ty = Math.min(texH - 1, Math.max(0, Math.floor(v * texH)));
        const ti = (ty * texW + tx) * 3;
        img[k * 3] = tex[ti]; img[k * 3 + 1] = tex[ti + 1]; img[k * 3 + 2] = tex[ti + 2];
      }
    }
  }
  return { img, depth, triId, P };
}

export const savePng = (path, data, w, h) => sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 3 } }).png().toFile(path);
