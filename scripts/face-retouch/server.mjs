// Tiny static server: /three/* -> node_modules/three, /proj/* -> project root, everything else -> this folder.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const PROJ = 'D:/Code/Tuyen/tuyen-portfolio';
const HERE = process.argv[2];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file;
  if (url.startsWith('/three/')) file = join(PROJ, 'node_modules/three', url.slice(7));
  else if (url.startsWith('/proj/')) file = join(PROJ, url.slice(6));
  else file = join(HERE, url === '/' ? 'index.html' : url);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found ' + url);
  }
}).listen(5310, () => console.log('serving on 5310'));
