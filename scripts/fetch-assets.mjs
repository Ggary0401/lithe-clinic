// 一次性工具：掃描 content/pages/*.json 內的圖片網址，下載到 assets/img/，並寫出 content/assets.json（網址 → 本機檔名）
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const urls = new Set(['https://lithe-med.com/wp-content/uploads/2024/02/LOGO_180X60_300.png', 'https://lithe-med.com/wp-content/uploads/2024/02/LOGO_180X60_300_R.png', 'https://lithe-med.com/wp-content/uploads/2024/02/LOGO_B_150ppi.png', 'https://lithe-med.com/wp-content/uploads/2024/02/LOGO-3.png', 'https://lithe-med.com/wp-content/uploads/2024/02/lithemed_1200x675.png']);
for (const f of readdirSync(join(ROOT, 'content/pages'))) {
  const d = JSON.parse(readFileSync(join(ROOT, 'content/pages', f), 'utf8'));
  if (d.og) urls.add(d.og);
  for (const tree of [d.tree, d.treeM]) (function walk(n) {
    if (!n || typeof n === 'string') return;
    for (const k of ['pb', 'pa']) if (n[k]?.img) for (const m of n[k].img.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(m[1]);
    for (const u of [n.bgImg, n.t === 'img' && n.src, n.poster]) if (u && /^https?:/.test(u)) urls.add(u);
    (n.c || []).forEach(walk);
  })(tree);
}
const mapPath = join(ROOT, 'content/assets.json');
const map = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, 'utf8')) : {};
mkdirSync(join(ROOT, 'assets/img'), { recursive: true });
const used = new Set(Object.values(map));
const todo = [...urls].filter((u) => !map[u]);
console.log(`共 ${urls.size} 張，待下載 ${todo.length}`);
let i = 0;
async function worker() {
  while (i < todo.length) {
    const u = todo[i++];
    try {
      const res = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      let base = decodeURIComponent(new URL(u).pathname.split('/').pop()).replace(/[^\w.\-]+/g, '_');
      if (!extname(base)) base += '.bin';
      if (used.has(base)) base = createHash('md5').update(u).digest('hex').slice(0, 6) + '-' + base;
      used.add(base);
      writeFileSync(join(ROOT, 'assets/img', base), buf);
      map[u] = base;
    } catch (e) { console.log('失敗', u, e.message); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
writeFileSync(mapPath, JSON.stringify(map, null, 1));
console.log('完成', Object.keys(map).length);
