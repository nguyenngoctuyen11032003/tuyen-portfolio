// node closeup.mjs <outDir> <yaw> [cx cy span size] — unlit face closeup with a labelled pixel grid.
import sharp from 'sharp';
import { loadAvatar, rasterise, rotator } from './mesh.mjs';

const [out, yawArg, cxArg = '0.04', cyArg = '0.80', spanArg = '0.2', sizeArg = '1000'] = process.argv.slice(2);
const yaw = Number(yawArg), cx = Number(cxArg), cy = Number(cyArg), span = Number(spanArg), size = Number(sizeArg);
const m = await loadAvatar(process.env.GLB ?? 'D:/Code/Tuyen/tuyen-portfolio/public/3D_avatar.glb');
const { img } = rasterise(m, rotator(yaw, 0), { size, cx, cy, scale: size / span });
// Grid every 100 px with labels.
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`;
for (let g = 100; g < size; g += 100) {
  svg += `<line x1="${g}" y1="0" x2="${g}" y2="${size}" stroke="#00ff88" stroke-opacity="0.35"/><line x1="0" y1="${g}" x2="${size}" y2="${g}" stroke="#00ff88" stroke-opacity="0.35"/>`;
  svg += `<text x="${g + 3}" y="14" font-size="13" fill="#00ff88">${g}</text><text x="3" y="${g - 3}" font-size="13" fill="#00ff88">${g}</text>`;
}
svg += '</svg>';
await sharp(Buffer.from(img), { raw: { width: size, height: size, channels: 3 } })
  .composite([{ input: Buffer.from(svg) }])
  .png()
  .toFile(`${out}/closeup-y${yaw}${process.env.TAG ?? ''}.png`);
console.log('ok', yaw);
