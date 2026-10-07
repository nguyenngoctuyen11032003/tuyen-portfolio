// Builds small WebP thumbnails for every project screenshot in public/projects and a
// manifest (src/data/projectThumbs.json) with each original's size, used by the 3D
// archive and the project card covers. Run after adding screenshots:
//   node scripts/make_thumbs.mjs
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'public', 'projects');
const outDir = path.join(srcDir, 'thumbs');
const manifestPath = path.join(root, 'src', 'data', 'projectThumbs.json');
const THUMB_WIDTH = 720;

await mkdir(outDir, { recursive: true });
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
  manifest[`/projects/${file}`] = { thumb: `/projects/thumbs/${base}.webp`, w: width, h: height };
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${files.length} thumbnails -> public/projects/thumbs, manifest -> src/data/projectThumbs.json`);
