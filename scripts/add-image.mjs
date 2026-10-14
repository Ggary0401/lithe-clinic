// 把圖片放進網站：不用管資料夾與檔名。
//   node scripts/add-image.mjs <本機路徑或網址> [自訂名稱]
// 會自動：複製到 assets/img/、取安全檔名、過大時縮小（macOS 用 sips；其他系統只提醒）、印出可直接寫進內容的路徑。
import { copyFileSync, writeFileSync, readFileSync, unlinkSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const IMG = join(ROOT, 'assets/img');
const MAX_SIDE = 2000;
const OK = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);

const sips = (...a) => { try { return execFileSync('sips', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };

export async function addImage(src, name) {
  mkdirSync(IMG, { recursive: true });
  const isUrl = /^https?:\/\//.test(src);
  let ext = extname(isUrl ? new URL(src).pathname : src).toLowerCase();
  let buf;
  if (isUrl) {
    const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`下載失敗 ${res.status}：${src}`);
    buf = Buffer.from(await res.arrayBuffer());
    if (!ext) ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[res.headers.get('content-type')] || '.jpg';
  } else {
    if (!existsSync(src)) throw new Error(`找不到檔案：${src}`);
    buf = readFileSync(src);
  }
  const heic = ['.heic', '.heif'].includes(ext);
  if (!OK.has(ext) && !heic) throw new Error(`不支援的圖片格式 ${ext || '(無副檔名)'}，請用 jpg / png / webp`);

  const stem = (name || basename(isUrl ? new URL(src).pathname : src, extname(src))).normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40) || 'image';
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 6);
  const finalExt = heic ? '.jpg' : ext === '.jpeg' ? '.jpg' : ext;
  const file = `${stem}-${hash}${finalExt}`;
  const out = join(IMG, file);
  if (!existsSync(out)) {
    const tmp = join(IMG, `.tmp-${hash}${ext}`);
    writeFileSync(tmp, buf);
    let done = false;
    if (['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext)) {
      const info = sips('-g', 'pixelWidth', '-g', 'pixelHeight', tmp);
      if (info) {
        const w = +info.match(/pixelWidth: (\d+)/)[1], h = +info.match(/pixelHeight: (\d+)/)[1];
        const big = buf.length > 300 * 1024 || Math.max(w, h) > MAX_SIDE;
        if (heic || big) {
          const toJpg = heic || (ext === '.webp') ;
          const target = toJpg ? out.replace(/\.\w+$/, '.jpg') : out;
          if (sips('-Z', String(Math.min(MAX_SIDE, Math.max(w, h))), '--setProperty', 'format', toJpg || ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : ext.slice(1), '--setProperty', 'formatOptions', '78', tmp, '--out', target) !== null) done = true;
          if (done && target !== out) return finish(basename(target), buf.length, tmp);
        }
      }
    }
    if (!done) copyFileSync(tmp, out);
    return finish(file, buf.length, tmp);
  }
  return finish(file, buf.length);
}

async function finish(file, srcBytes, tmp) {
  if (tmp && existsSync(tmp)) unlinkSync(tmp);
  const p = join(IMG, file);
  const kb = Math.round(statSync(p).size / 1024);
  const note = kb > 1500 ? '  ⚠ 圖片偏大（>1.5MB），建議先縮小再加入，以免拖慢網站' : '';
  return { file, sitePath: `/assets/img/${file}`, kb, note };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [src, name] = process.argv.slice(2);
  if (!src) { console.error('用法：node scripts/add-image.mjs <本機路徑或網址> [自訂名稱]'); process.exit(1); }
  try {
    const r = await addImage(src, name);
    console.log(`已加入：${r.sitePath}（${r.kb}KB）${r.note}\n在內容裡直接使用這個路徑即可。`);
  } catch (e) { console.error('失敗：' + e.message); process.exit(1); }
}
