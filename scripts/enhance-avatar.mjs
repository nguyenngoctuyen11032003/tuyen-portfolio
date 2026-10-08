// Enhances the raw avatar scan before it is compressed for the web.
//   node scripts/enhance-avatar.mjs <in.glb> <out.glb> [--base <basecolor.jpg>] [--smooth-normals <mask.png>]
// --base swaps in a hand-edited base colour (same 2048² atlas layout) before grading, e.g. the face
// retouch (darker irises, softer brows, monolid upper lid) baked from a render.
// 1. Base colour: skin is warmed and slightly deepened (the scan's skin is a pale pink that reads
//    chalk-white under the hero's lights), then the whole texture gets a mild unsharp mask.
// 2. --smooth-normals blurs the normal map where the (atlas-sized, greyscale) mask is white: the scan
//    carries frown lines and creases in its normals too, and they still read under the hero lights
//    once the base colour is clean. Elsewhere normal / roughness textures are kept bit-for-bit.
// The output is a plain GLB. Compress it for the web WITHOUT simplifying (simplify blurs the face):
//   npx @gltf-transform/cli@4.5.1 optimize <out.glb> public/models/tuyen-avatar.glb \
//     --compress meshopt --texture-compress webp --texture-size 2048 --simplify false
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [input, output, ...rest] = process.argv.slice(2);
const opt = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : null; };
const baseArg = opt('--base');
const normalMaskArg = opt('--smooth-normals');
if (!input || !output) {
  console.error('Usage: node scripts/enhance-avatar.mjs <in.glb> <out.glb>');
  process.exit(1);
}

/* ------------------------------------------------------------------ GLB I/O */

function readGlb(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binHeader = 20 + jsonLen;
  const binLen = buf.readUInt32LE(binHeader);
  const bin = buf.subarray(binHeader + 8, binHeader + 8 + binLen);
  return { json, bin };
}

const pad4 = (n) => (n + 3) & ~3;

/** Rebuilds the BIN chunk with some bufferViews replaced, re-packing every view 4-byte aligned. */
function writeGlb(path, json, bin, replaced) {
  const parts = [];
  let offset = 0;
  json.bufferViews.forEach((bv, i) => {
    const data = replaced.get(i) ?? bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
    const start = pad4(offset);
    if (start > offset) parts.push(Buffer.alloc(start - offset));
    parts.push(Buffer.from(data));
    bv.byteOffset = start;
    bv.byteLength = data.length;
    offset = start + data.length;
  });
  const binOut = Buffer.concat(parts, offset);
  const binPadded = Buffer.concat([binOut, Buffer.alloc(pad4(binOut.length) - binOut.length)]);
  json.buffers = [{ byteLength: binPadded.length }];
  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad4(jsonBuf.length) - jsonBuf.length, 0x20)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binPadded.length, 8);
  const chunk = (len, type) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(len, 0);
    h.writeUInt32LE(type, 4);
    return h;
  };
  writeFileSync(path, Buffer.concat([header, chunk(jsonBuf.length, 0x4e4f534a), jsonBuf, chunk(binPadded.length, 0x004e4942), binPadded]));
}

/* ------------------------------------------------------------ colour work */

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** 0..1: how much a pixel looks like the scan's skin (warm, light, red > green > blue). */
function skinWeight(r, g, b) {
  if (!(r > g && g >= b)) return 0;
  const warm = smooth(15, 35, r - b) * (1 - smooth(110, 140, r - b));
  const light = smooth(120, 170, r);
  const chroma = smooth(12, 30, r - Math.min(g, b));
  return warm * light * chroma;
}

async function gradeBaseColor(jpeg, faceMask) {
  const { data, info } = await sharp(jpeg).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const w = skinWeight(r, g, b);
    if (!w) continue;
    // Warmer, a touch deeper and less pink: towards a natural light-tan skin.
    const tr = r * 0.95, tg = g * 0.90 + 1, tb = b * 0.82;
    out[i] = Math.round(r + (tr - r) * w);
    out[i + 1] = Math.round(g + (tg - g) * w);
    out[i + 2] = Math.round(b + (tb - b) * w);
  }
  // Skin gets a mild unsharp mask; everything else (jacket, strap, hair, cup) a stronger one so the
  // fabric weave, piping and hair strands read crisply.
  const rawOpts = { raw: { width: info.width, height: info.height, channels: 3 } };
  const mild = await sharp(out, rawOpts).sharpen({ sigma: 1, m1: 0.4, m2: 1.4 }).raw().toBuffer();
  const strong = await sharp(out, rawOpts).sharpen({ sigma: 1.4, m1: 0.9, m2: 2.4 }).raw().toBuffer();
  const mixed = Buffer.alloc(out.length);
  for (let i = 0; i < out.length; i += 3) {
    // Inside the face mask (retouched skin, repainted eyes) nothing: they are drawn crisp already and
    // any unsharp mask rings white around the lash lines.
    if (faceMask?.[i / 3]) { for (let c = 0; c < 3; c++) mixed[i + c] = out[i + c]; continue; }
    const w = skinWeight(out[i], out[i + 1], out[i + 2]);
    for (let c = 0; c < 3; c++) mixed[i + c] = Math.round(mild[i + c] * w + strong[i + c] * (1 - w));
  }
  return sharp(mixed, rawOpts).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
}

/** Blends the normal map towards a blurred copy of itself by the mask (feathered). */
async function smoothNormals(image, maskPath) {
  const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rawOpts = { raw: { width: info.width, height: info.height, channels: 3 } };
  const soft = await sharp(data, rawOpts).blur(5).raw().toBuffer();
  const mask = await sharp(maskPath).resize(info.width, info.height).greyscale().blur(3).raw().toBuffer();
  const out = Buffer.alloc(data.length);
  for (let p = 0; p < mask.length; p++) {
    const w = Math.min(1, (mask[p] / 255) * 1.2);
    for (let c = 0; c < 3; c++) out[p * 3 + c] = Math.round(data[p * 3 + c] * (1 - w) + soft[p * 3 + c] * w);
  }
  return sharp(out, rawOpts).png().toBuffer();
}

/* -------------------------------------------------------------------- run */

const { json, bin } = readGlb(input);
const mat = json.materials[0];
const baseTex = json.textures[mat.pbrMetallicRoughness.baseColorTexture.index];
const baseImg = json.images[baseTex.source];
const bv = json.bufferViews[baseImg.bufferView];
const jpeg = baseArg ? readFileSync(baseArg) : bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);

const faceMask = normalMaskArg ? await sharp(normalMaskArg).greyscale().raw().toBuffer() : null;
const graded = await gradeBaseColor(jpeg, faceMask);
baseImg.mimeType = 'image/jpeg';
const replaced = new Map([[baseImg.bufferView, graded]]);
if (normalMaskArg) {
  const nImg = json.images[json.textures[mat.normalTexture.index].source];
  const nbv = json.bufferViews[nImg.bufferView];
  const smoothed = await smoothNormals(bin.subarray(nbv.byteOffset ?? 0, (nbv.byteOffset ?? 0) + nbv.byteLength), normalMaskArg);
  nImg.mimeType = 'image/png';
  replaced.set(nImg.bufferView, smoothed);
  console.log('normal map smoothed under', normalMaskArg);
}
writeGlb(output, json, bin, replaced);
console.log(`wrote ${output}: base colour graded + sharpened (${(graded.length / 1024) | 0} KB)`);
