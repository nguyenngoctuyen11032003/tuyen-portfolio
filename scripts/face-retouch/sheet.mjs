// node sheet.mjs <out.png> <tile> <cols> <img1> <img2> ...
import sharp from 'sharp';
const [out, tileArg, colsArg, ...files] = process.argv.slice(2);
const tile = Number(tileArg), cols = Number(colsArg);
const tiles = [];
for (const f of files) tiles.push(await sharp(f).resize(tile, tile, { fit: 'contain', background: '#000' }).toBuffer());
const rows = Math.ceil(tiles.length / cols);
await sharp({ create: { width: tile * cols, height: tile * rows, channels: 3, background: '#000' } })
  .composite(tiles.map((input, i) => ({ input, left: (i % cols) * tile, top: Math.floor(i / cols) * tile }))).png().toFile(out);
console.log('ok', out);
