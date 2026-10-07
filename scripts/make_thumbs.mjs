// Builds WebP versions of every project screenshot in public/projects: a small thumbnail
// (thumbs/, 720px) for the 3D archive, card covers and gallery strip, and a medium copy
// (medium/, 1600px) for the featured stage and the gallery's main image. Also writes a
// manifest (src/data/projectThumbs.json) with each original's size. Run after adding screenshots:
//   node scripts/make_thumbs.mjs
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'public', 'projects');
const outDir = path.join(srcDir, 'thumbs');
const mediumDir = path.join(srcDir, 'medium');
const manifestPath = path.join(root, 'src', 'data', 'projectThumbs.json');
const THUMB_WIDTH = 720;
const MEDIUM_WIDTH = 1600;

await mkdir(outDir, { recursive: true });
await mkdir(mediumDir, { recursive: true });
const files = (await readdir(srcDir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();

const manifest = {};
for (const file of files) {
  const base = file.replace(/\.[^.]+$/, '');
  const input = path.join(srcDir, file);
  const { width, height } = await sharp(input).metadata();
  await sharp(input)
    .resize({ width: Math.min(THUMB_WIDTH, width), withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(outDir, `${base}.webp`));
  await sharp(input)
    .resize({ width: Math.min(MEDIUM_WIDTH, width), withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(mediumDir, `${base}.webp`));
  manifest[`/projects/${file}`] = {
    thumb: `/projects/thumbs/${base}.webp`,
    medium: `/projects/medium/${base}.webp`,
    w: width,
    h: height,
  };
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${files.length} screenshots -> public/projects/{thumbs,medium}, manifest -> src/data/projectThumbs.json`);
