// 內容維護工具（零外部依賴）。頁面內容存在 content/pages/*.json，這支腳本負責安全地查找與修改。
//
//   node scripts/content.mjs pages                          列出所有頁面（名稱、網址、標題）
//   node scripts/content.mjs find <文字>                    找出哪些頁面、哪個位置有這段文字
//   node scripts/content.mjs replace <舊文字> <新文字> [--page 名稱] [--dry]
//                                                           取代文字（桌機與手機版一起改）
//   node scripts/content.mjs set-link <舊網址片段> <新網址> [--page 名稱] [--dry]
//                                                           取代連結
//   node scripts/content.mjs set-image <舊圖片檔名片段> <新圖片> [--page 名稱] [--dry]
//                                                           換圖。新圖片可以是本機路徑、網址，或 /assets/img/ 內已有的圖
//   node scripts/content.mjs images [--page 名稱]            列出頁面用到的圖片
//
// 注意：replace 只會改「單一文字節點」內的完整字串；一段話被 <br> 或粗體切開時，要分段各改一次。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { addImage } from './add-image.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const DIR = join(ROOT, 'content/pages');
const pagesIndex = JSON.parse(readFileSync(join(ROOT, 'content/pages.json'), 'utf8'));

const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const bool = (n) => { const i = argv.indexOf(n); if (i < 0) return false; argv.splice(i, 1); return true; };
const onlyPage = flag('--page');
const dry = bool('--dry');
const [cmd, a, b] = argv;

function names() {
  const all = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  if (!onlyPage) return all;
  const hit = pagesIndex.find((p) => p.name === onlyPage || p.path === onlyPage.replace(/^\/|\/$/g, ''));
  if (!hit) { console.error(`找不到頁面「${onlyPage}」，用 pages 指令查看清單`); process.exit(1); }
  return [hit.name];
}
const load = (n) => JSON.parse(readFileSync(join(DIR, n + '.json'), 'utf8'));
const save = (n, d) => writeFileSync(join(DIR, n + '.json'), JSON.stringify(d));
const url = (n) => '/' + (pagesIndex.find((p) => p.name === n)?.path || '') + (pagesIndex.find((p) => p.name === n)?.path ? '/' : '');

// 走訪兩棵版面樹，fn(node, parent, index, treeName)
function walk(d, fn) {
  for (const t of ['tree', 'treeM']) {
    if (!d[t]) continue;
    (function w(n, parent, i) {
      fn(n, parent, i, t);
      if (n && typeof n === 'object') (n.c || []).forEach((k, j) => w(k, n, j));
    })(d[t], null, 0);
  }
}
const snippet = (s, at, len) => s.slice(Math.max(0, at - 12), at + len + 12).replace(/\s+/g, ' ');

if (cmd === 'pages') {
  for (const p of pagesIndex) console.log(`${p.name.padEnd(28)} ${url(p.name).padEnd(34)} ${p.title}`);
} else if (cmd === 'find') {
  if (!a) usage();
  let total = 0;
  for (const n of names()) {
    const d = load(n);
    const hits = [];
    if (d.title?.includes(a)) hits.push('〔頁面標題〕' + d.title);
    if (d.desc?.includes(a)) hits.push('〔頁面描述〕' + d.desc);
    walk(d, (node, _p, _i, t) => {
      if (typeof node === 'string' && node.includes(a)) hits.push(`〔${t === 'tree' ? '桌機' : '手機'}〕…${snippet(node, node.indexOf(a), a.length)}…`);
      else if (node && typeof node === 'object') {
        for (const k of ['href', 'src', 'bgImg', 'alt']) if (typeof node[k] === 'string' && node[k].includes(a)) hits.push(`〔${t === 'tree' ? '桌機' : '手機'}.${k}〕${node[k]}`);
      }
    });
    if (hits.length) { total += hits.length; console.log(`\n${n}  ${url(n)}`); hits.slice(0, 8).forEach((h) => console.log('  ' + h)); if (hits.length > 8) console.log(`  …另外還有 ${hits.length - 8} 處`); }
  }
  console.log(total ? `\n共 ${total} 處` : '沒有找到');
} else if (cmd === 'replace') {
  if (!a || b == null) usage();
  let total = 0, pagesHit = 0;
  for (const n of names()) {
    const d = load(n);
    let c = 0;
    for (const k of ['title', 'desc']) if (d[k]?.includes(a)) { d[k] = d[k].split(a).join(b); c++; }
    walk(d, (node, parent, i) => {
      if (typeof node === 'string' && node.includes(a) && parent) { parent.c[i] = node.split(a).join(b); c++; }
      else if (node && typeof node === 'object' && typeof node.alt === 'string' && node.alt.includes(a)) { node.alt = node.alt.split(a).join(b); c++; }
    });
    if (c) { total += c; pagesHit++; if (pagesHit <= 8) console.log(`${dry ? '[預覽] ' : ''}${n} ${url(n)}：${c} 處`); if (!dry) save(n, d); }
  }
  if (pagesHit > 8) console.log(`…等共 ${pagesHit} 個頁面（每頁含桌機與手機版）`);
  console.log(total ? `${dry ? '（預覽，未寫入）' : '已修改'} 共 ${total} 處，影響 ${pagesHit} 個頁面。記得 npm run build。` : '沒有找到這段文字。用 find 看看實際內容是否被 <br> 或粗體切開。');
} else if (cmd === 'set-link') {
  if (!a || !b) usage();
  let total = 0;
  for (const n of names()) {
    const d = load(n);
    let c = 0;
    walk(d, (node) => { if (node && typeof node === 'object' && typeof node.href === 'string' && node.href.includes(a)) { node.href = node.href.split(a).join(b); c++; } });
    if (c) { total += c; console.log(`${dry ? '[預覽] ' : ''}${n}：${c} 個連結`); if (!dry) save(n, d); }
  }
  console.log(total ? '完成。記得 npm run build。' : '沒有找到符合的連結。');
} else if (cmd === 'set-image') {
  if (!a || !b) usage();
  const target = dry ? b : /^\/assets\/img\//.test(b) ? b : (await addImage(b)).sitePath;
  let total = 0;
  for (const n of names()) {
    const d = load(n);
    let c = 0;
    walk(d, (node) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.src === 'string' && node.t === 'img' && node.src.includes(a)) { node.src = target; c++; }
      if (typeof node.bgImg === 'string' && node.bgImg.includes(a)) { node.bgImg = target; c++; }
    });
    if (c) { total += c; console.log(`${dry ? '[預覽] ' : ''}${n} ${url(n)}：${c} 處圖片 → ${target}`); if (!dry) save(n, d); }
  }
  console.log(total ? '完成。記得 npm run build。' : '沒有找到符合的圖片。用 images 指令查看頁面用到的圖片檔名。');
} else if (cmd === 'images') {
  for (const n of names()) {
    const d = load(n);
    const seen = new Set();
    walk(d, (node) => {
      if (!node || typeof node !== 'object') return;
      for (const u of [node.t === 'img' && node.src, node.bgImg]) if (u) seen.add(basename(decodeURIComponent(u.split('?')[0])));
    });
    console.log(`\n${n} ${url(n)}\n  ${[...seen].join('\n  ') || '（無）'}`);
  }
} else usage();

function usage() {
  console.error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(1);
}
