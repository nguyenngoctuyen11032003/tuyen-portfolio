// Builds the small square WebP copies the cursor image trail (ImageTrail.tsx) deals out, from the
// originals in "public/image trail effect", and writes their paths to src/data/trailImages.json.
// Cards render at ~150px at most, so 320px covers 2x screens. Run after adding photos:
//   node scripts/make_trail.mjs
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'public', 'image trail effect');
const outDir = path.join(root, 'public', 'trail');
const manifestPath = path.join(root, 'src', 'data', 'trailImages.json');
const SIZE = 320;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const files = (await readdir(srcDir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();

const manifest = [];
for (const [i, file] of files.entries()) {
  const name = `trail-${String(i + 1).padStart(2, '0')}.webp`;
  await sharp(path.join(srcDir, file))
    .resize(SIZE, SIZE, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, name));
  manifest.push(`/trail/${name}`);
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${files.length} photos -> public/trail, manifest -> src/data/trailImages.json`);
