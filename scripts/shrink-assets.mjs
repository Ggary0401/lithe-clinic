// 一次性工具：把過大的圖縮到長邊 2000px 以內；webp / 無透明的大 png 轉成 jpg，並同步更新 content/assets.json
import { readFileSync, writeFileSync, statSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const mapPath = join(ROOT, 'content/assets.json');
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const sips = (...a) => execFileSync('sips', a, { encoding: 'utf8' });
for (const [url, name] of Object.entries(map)) {
  const p = join(ROOT, 'assets/img', name);
  const ext = extname(name).toLowerCase();
  const big = statSync(p).size > 300 * 1024;
  try {
    const info = sips('-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', p);
    const w = +info.match(/pixelWidth: (\d+)/)[1], h = +info.match(/pixelHeight: (\d+)/)[1];
    const alpha = /hasAlpha: yes/.test(info);
    const toJpg = (ext === '.webp' && !alpha) || (ext === '.png' && !alpha && big);
    if (!big && !toJpg && Math.max(w, h) <= (ext === '.png' ? 1400 : 2000)) continue;
    const out = toJpg ? p.replace(/\.\w+$/, '.jpg') : p;
    const args = ['-Z', String(Math.min(ext === '.png' ? 1400 : 2000, Math.max(w, h))), '--setProperty', 'format', toJpg || ext.startsWith('.jp') ? 'jpeg' : ext.slice(1), '--setProperty', 'formatOptions', '72', p, '--out', out];
    sips(...args);
    if (out !== p) { unlinkSync(p); map[url] = name.replace(/\.\w+$/, '.jpg'); }
  } catch (e) { console.log('略過', name, String(e.message).split('\n')[0]); }
}
writeFileSync(mapPath, JSON.stringify(map, null, 1));
