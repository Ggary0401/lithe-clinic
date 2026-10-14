// 本機預覽（零依賴，Windows / Mac 都能用）：建置後用 http://localhost:4173 看 public/。按 Ctrl+C 結束。
//   npm run serve
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public');
const PORT = +process.env.PORT || 4173;
execFileSync('node', [join(ROOT, 'scripts/build.mjs')], { stdio: 'inherit' });
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.ico': 'image/x-icon' };

createServer((req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end('bad request'); return; }
  let file = normalize(join(OUT, path));
  if (!file.startsWith(OUT)) { res.writeHead(403).end('forbidden'); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(existsSync(join(OUT, '404.html')) ? readFileSync(join(OUT, '404.html')) : 'not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }).end(readFileSync(file));
}).listen(PORT, () => console.log(`預覽中：http://localhost:${PORT}  （按 Ctrl+C 結束）`));
