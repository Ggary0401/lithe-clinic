// 發佈前的靜態檢查（零依賴）：掃描 public/ 內所有頁面，確認站內連結、圖片、canonical 都沒壞。
//   node scripts/verify.mjs      有問題會列出並以非 0 結束
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public');
const problems = [];

function pages(dir) {
  let out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'assets') out = out.concat(pages(p)); }
    else if (f === 'index.html') out.push(p);
  }
  return out;
}
const dirExists = (path) => existsSync(join(OUT, path, 'index.html')) || existsSync(join(OUT, path));

let n = 0;
for (const file of pages(OUT)) {
  n++;
  const rel = file.slice(OUT.length) || '/';
  const html = readFileSync(file, 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${rel} 沒有 <title>`);
  if (!/rel="canonical" href="https:\/\/lithe-med\.com\//.test(html)) problems.push(`${rel} canonical 不是 https://lithe-med.com/…`);
  for (const m of html.matchAll(/\b(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const path = decodeURIComponent(m[1]);
    if (path.startsWith('//')) continue;
    if (!dirExists(path)) problems.push(`${rel} 指向不存在的 ${m[1]}`);
  }
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/lithe-med\.com[^"]*)"/g)) problems.push(`${rel} 還有指向舊網址的連結 ${m[1]}（站內連結請用相對路徑）`);
}
// pages.css 內引用的圖片
const css = readFileSync(join(OUT, 'assets/pages.css'), 'utf8');
for (const m of css.matchAll(/url\((\/assets\/img\/[^)]+)\)/g)) if (!existsSync(join(OUT, decodeURIComponent(m[1])))) problems.push(`樣式引用不存在的圖片 ${m[1]}`);

const uniq = [...new Set(problems)];
if (uniq.length) { console.error(`✗ 檢查 ${n} 頁，發現 ${uniq.length} 個問題：\n` + uniq.slice(0, 40).map((x) => '  - ' + x).join('\n')); process.exit(1); }
console.log(`✓ 檢查 ${n} 頁：站內連結、圖片、canonical 都正常`);
