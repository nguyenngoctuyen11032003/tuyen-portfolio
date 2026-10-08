// node render.mjs <outDir> <name>=<url>[;...] <yaws> [json opts]  -> <out>/<name>-y<yaw>[-unlit][tag].png
// Run with MSYS_NO_PATHCONV=1 under Git Bash (otherwise "/proj/..." is rewritten to a Windows path).
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [out, list, yawsArg = '0', optsArg = '{}'] = process.argv.slice(2);
const opts = JSON.parse(optsArg);
const models = list.split(';').map((s) => s.split('='));
const yaws = yawsArg.split(',').map(Number);
const dbg = 9700 + Math.floor(Math.random() * 60);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${dbg}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--user-data-dir=${out}/prof-${Date.now()}`, 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t;
for (let i = 0; i < 40 && !t; i++) {
  await sleep(500);
  try { t = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find((x) => x.type === 'page'); } catch {}
}
if (!t) { console.error('chrome did not start'); chrome.kill(); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const p = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id) p.get(m.id)?.(m.result ?? m.error); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.navigate', { url: 'http://localhost:5310/' });
await sleep(3000);
for (const [name, url] of models) for (const yaw of yaws) {
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    const r = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `renderFace(${JSON.stringify(url)}, ${JSON.stringify({ ...opts, yaw })}).then(v => v, e => 'ERR ' + e.message)` });
    const v = r.result?.value;
    if (typeof v === 'string' && v.startsWith('data:')) {
      writeFileSync(`${out}/${name}-y${yaw}${opts.unlit ? '-unlit' : ''}${opts.tag ?? ''}.png`, Buffer.from(v.split(',')[1], 'base64'));
      console.log('shot', name, yaw); ok = true;
    } else { console.log('retry', name, yaw, String(v).slice(0, 120)); await sleep(1500); }
  }
}
ws.close(); chrome.kill(); process.exit(0);
