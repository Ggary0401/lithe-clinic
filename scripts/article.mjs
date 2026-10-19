// 文章工具：新增、列出文章。文章存成 content/articles/<網址名稱>.md，建置時變成 /articles/<網址名稱>/。
//
//   node scripts/article.mjs new --title "標題" --desc "一兩句摘要" [--slug english-name] [--date 2026-10-19]
//                                [--cover <圖片路徑或網址>] (--body-file <內文檔> | --body "內文")
//   node scripts/article.mjs list
//
// 內文用 Markdown：## 標題、### 小標題、- 清單、> 引言、**粗體**、[文字](網址)、![說明](圖片路徑)
// 內文中的圖片先用 `node scripts/add-image.mjs <路徑>` 放進網站，再把印出的 /assets/img/… 寫進內文。
// 修改既有文章：直接改 content/articles/ 裡那個 .md 檔，然後 npm run build。
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { addImage } from './add-image.mjs';
import { parseArticle } from './markdown.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'content/articles');

const argv = process.argv.slice(2);
const cmd = argv.shift();
const opt = (n) => { const i = argv.indexOf(n); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };

function usage(code = 1) {
  console.error(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(code);
}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fail = (m) => { console.error('✗ ' + m); process.exit(1); };

if (cmd === 'list') {
  const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.md')) : [];
  if (!files.length) console.log('還沒有文章。');
  const rows = files.map((f) => ({ slug: f.replace(/\.md$/, ''), ...parseArticle(readFileSync(join(DIR, f), 'utf8')).meta })).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  for (const r of rows) console.log(`${r.date}  /articles/${r.slug}/  ${r.title}`);
} else if (cmd === 'new') {
  const title = opt('--title'), desc = opt('--desc') || '', bodyFile = opt('--body-file'), bodyArg = opt('--body'), cover = opt('--cover');
  const date = opt('--date') || today();
  let slug = opt('--slug');
  if (!title) fail('請提供 --title');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('日期格式要像 2026-10-19');
  if (!slug) slug = 'post-' + date.replace(/-/g, '') + '-' + String(Date.now()).slice(-4);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail('--slug 只能用小寫英文、數字與連字號，例如 filler-aftercare');
  let body = bodyFile ? (existsSync(bodyFile) ? readFileSync(bodyFile, 'utf8') : fail(`找不到內文檔 ${bodyFile}`)) : bodyArg;
  if (!body || !body.trim()) fail('請提供內文：--body-file <檔案> 或 --body "…"');
  mkdirSync(DIR, { recursive: true });
  const file = join(DIR, slug + '.md');
  if (existsSync(file)) fail(`/articles/${slug}/ 已經有文章了。要改請直接編輯 content/articles/${slug}.md，或換一個 --slug`);
  let coverPath = '';
  if (cover) coverPath = /^\/assets\/img\//.test(cover) ? cover : (await addImage(cover)).sitePath;
  const clean = (s) => s.replace(/\s*\n\s*/g, ' ').trim();
  writeFileSync(file, `---\ntitle: ${clean(title)}\ndate: ${date}\ndesc: ${clean(desc)}\ncover: ${coverPath}\n---\n\n${body.trim()}\n`, 'utf8');
  console.log(`✓ 已建立 content/articles/${slug}.md\n  文章網址：/articles/${slug}/\n  接著執行 npm run build 與 npm run verify，預覽用 npm run serve`);
} else usage(cmd ? 1 : 0);
