// One-off: removes the generator's ✦ watermark from the hero illustration and exports the WebP assets.
// Usage: node scripts/retouch-hero-illustration.mjs <path-to-original.png>
import sharp from 'sharp';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/retouch-hero-illustration.mjs <original.png>');
  process.exit(1);
}

// The mark sits on the desk at about x 692–735, y 896–939 (of 820×1024). The desk band to its right,
// on the same rows, is clean and has the same mouse-pad edge, so a horizontally shifted patch blends.
const target = { left: 684, top: 888, width: 60, height: 58 };
const sourceLeft = target.left + 60;

const patch = await sharp(src)
  .extract({ left: sourceLeft, top: target.top, width: target.width, height: target.height })
  .toBuffer();

const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${target.width}" height="${target.height}">
    <defs><radialGradient id="g"><stop offset="0.62" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${target.width / 2}" cy="${target.height / 2}" rx="${target.width / 2}" ry="${target.height / 2}" fill="url(#g)"/>
  </svg>`
);
const feathered = await sharp(patch)
  .ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const clean = await sharp(src)
  .composite([{ input: feathered, left: target.left, top: target.top }])
  .png()
  .toBuffer();

await sharp(clean).webp({ quality: 84 }).toFile('src/assets/hero-illustration.webp');
await sharp(clean).resize(480).webp({ quality: 82 }).toFile('src/assets/hero-illustration-480.webp');
console.log('wrote src/assets/hero-illustration.webp and hero-illustration-480.webp');
