// 沐澄診所官網建置腳本（零外部依賴，只用 node 內建模組）
// content/pages/*.json  頁面版面樹（由原站渲染後擷取）
// content/menu.json     主選單
// content/assets.json   原站圖片網址 → assets/img/ 檔名
// 輸出：public/（每次建置先清空再重建，請勿手動編輯）
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public');
const ASSETS = join(ROOT, 'assets');
const ORIGIN = 'https://lithe-med.com'; // 原站（只用來對應圖片網址）
const SITE_URL = 'https://lithe-med.com'; // 本站正式網址（canonical / og / sitemap）；原站網域改指向本站後，與 ORIGIN 相同
const SITE = '沐澄診所 LITHE CLINIC';

const pagesIndex = JSON.parse(readFileSync(join(ROOT, 'content/pages.json'), 'utf8'));
const imgMap = JSON.parse(readFileSync(join(ROOT, 'content/assets.json'), 'utf8'));
const menu = JSON.parse(readFileSync(join(ROOT, 'content/menu.json'), 'utf8'));

// ───────── 小工具 ─────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hash = (f) => createHash('sha256').update(readFileSync(join(ASSETS, f))).digest('hex').slice(0, 8);
const ver = {};
for (const f of ['style.css', 'site.js']) ver[f] = hash(f);

function localImg(u) {
  const f = imgMap[u];
  return f ? '/assets/img/' + encodeURIComponent(f) : u;
}
// 原站頁尾有幾個連到不存在的中文網址（404），這裡直接導向對應的正確頁面
const FIXED = { 品牌精神: 'spirit', 診所環境: 'environment', 醫師團隊: 'team', 醫學美容: 'aesthetic-medicine', 抗老逆齡: 'preventive-medicine', 預防醫學: 'preventive-medicine', 整形手術: 'cosmetic-surgery', 聯繫我們: 'contact' };
function localHref(h) {
  if (!h) return '#';
  let u;
  try { u = new URL(h); } catch { return h; }
  if (u.host === 'lithe-med.com') {
    let path = decodeURIComponent(u.pathname).replace(/^\/|\/$/g, '');
    if (FIXED[path]) path = FIXED[path];
    return '/' + (path ? path.split('/').map(encodeURIComponent).join('/') + '/' : '') + u.hash;
  }
  return h;
}
const isExternal = (h) => /^https?:/.test(h) && !h.startsWith(ORIGIN);

// ───────── 樣式去重：相同宣告共用一個 class ─────────
const classOf = new Map();
function cls(decl) {
  if (!decl) return '';
  let c = classOf.get(decl);
  if (!c) { c = 'z' + classOf.size; classOf.set(decl, c); }
  return c;
}

const PASS = ['display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'row-gap', 'column-gap', 'flex-grow', 'flex-shrink', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-bottom', 'background-color', 'background-size', 'background-position', 'background-repeat', 'background-attachment', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'box-shadow', 'opacity', 'overflow', 'text-align', 'color', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'text-decoration-line', 'grid-template-columns', 'grid-template-rows', 'object-fit', 'aspect-ratio', 'z-index', 'transform', 'mix-blend-mode', 'background-blend-mode', 'filter', 'backdrop-filter', 'align-self', 'order', 'white-space', 'text-shadow', 'vertical-align', 'justify-items', 'place-items', 'list-style-type'];

let MOBILE = false; // 渲染手機版面樹時為 true（不再縮字級、不再強制直排）
const px = (v) => parseFloat(v) || 0;
const zeroBorder = (v) => !v || /^0px/.test(v) || /none/.test(v) && /^0px/.test(v);

function declFor(n, parent) {
  const s = n.s || {};
  const d = [];
  const pc = parent?.s || {};
  const parentFlex = pc.display === 'flex' || pc.display === 'inline-flex';
  const parentRow = parentFlex && (pc['flex-direction'] || 'row').startsWith('row');
  const abs = s.position === 'absolute' || s.position === 'fixed';

  for (const k of PASS) {
    let v = s[k];
    if (v == null) continue;
    if (k.startsWith('border-') && k !== 'border-radius' && zeroBorder(v)) continue;
    if (k === 'font-size') continue;
    if (k === 'flex-grow' && v === '0') continue;
    if (k === 'transform' && /swiper|carousel/.test(n.cls || '')) continue;
    d.push(`${k}:${v}`);
  }
  // 字級：手機縮小
  if (s['font-size']) {
    const fs = px(s['font-size']);
    d.push(fs > 26 && !MOBILE ? `font-size:clamp(${Math.max(18, Math.round(fs * 0.62))}px,${(fs / 14.4).toFixed(2)}vw,${fs}px)` : `font-size:${s['font-size']}`);
  }
  if (s['font-family']) d.push(`font-family:${s['font-family'].replace(/"/g, "'")}`);
  // 背景圖
  if (n.bgImg) d.push(`background-image:${s['background-image'] ? s['background-image'] + ',' : ''}url(${localImg(n.bgImg)})`);
  else if (s['background-image']) d.push(`background-image:${s['background-image']}`);
  // 左右 margin
  const ml = px(s['margin-left']), mr = px(s['margin-right']);
  const w = s.w;
  const pw = parent ? Math.max(1, (pc.w || s.pw) - px(pc['padding-left']) - px(pc['padding-right'])) : s.pw;
  if (abs) {
    d.push(`position:${s.position}`);
    for (const k of ['top', 'right', 'bottom', 'left']) if (s[k] != null) d.push(`${k}:${s[k]}`);
    if (s.top != null && s.bottom != null && s.left != null && s.right != null) { /* 滿版遮罩 */ }
    else { if (w && !(s.left != null && s.right != null)) d.push(`width:${w}px;max-width:100%`); if (s.h && !(s.top != null && s.bottom != null)) d.push(`height:${s.h}px`); }
  } else {
    if (s.position === 'relative' || s.position === 'sticky') d.push(`position:${s.position}`);
    if (n.cls && /swiper|image-carousel/.test(n.cls)) { /* 輪播不帶負 margin */ }
    else if (ml > 0 && mr > 0 && Math.abs(ml - mr) < 2 && w < pw - 4) d.push('margin-left:auto;margin-right:auto');
    else { if (ml) d.push(`margin-left:${s['margin-left']}`); if (mr) d.push(`margin-right:${s['margin-right']}`); }
    if (n.t !== 'img' && w && pw && !(s.display || '').startsWith('inline') && n.t !== 'svg') {
      const grow = parentRow && s['flex-grow'] && s['flex-grow'] !== '0';
      if (parentFlex && !grow) {
        if (parentRow && w < pw - 2) d.push(`width:${((w / pw) * 100).toFixed(2)}%;max-width:100%`);
        else if (w >= pw - 2) d.push('width:100%');
        else if (!parentRow) d.push(`width:100%;max-width:${w}px`);
      } else if (!parentFlex && w < pw - 2 && !(ml > 0 && mr > 0)) {
        d.push(`max-width:${w}px;width:100%`);
      }
    }
  }
  if (s['min-height']) d.push(`min-height:${s['min-height']}`);
  else if (!n.c && s.h && n.t === 'div' && !abs) d.push(`min-height:${s.h}px`);
  if (s['max-width'] && !d.some((x) => x.startsWith('max-width'))) d.push(`max-width:${s['max-width']}`);
  if (s.fill) d.push(`fill:${s.fill}`);
  if (n.t === 'a' && s.h && s.h < 60 && !n.c?.some((k) => typeof k !== 'string' && k.t === 'img')) d.push('white-space:nowrap');
  return d.join(';');
}

// ───────── 版面樹 → HTML ─────────
const VOID = new Set(['br', 'img']);
const WRAP_OK = new Set(['div', 'span', 'section', 'figure', 'article', 'main', 'header']);

// Elementor 背景輪播（swiper 內的空 div 帶背景圖）→ 只取第一張當作滿版背景層
function slideshowBg(n) {
  if (!n || typeof n === 'string' || n.t !== 'div') return null;
  const el = (n.c || []).filter((k) => typeof k !== 'string');
  if ((n.cls || '').split(/\s+/).includes('swiper-wrapper')) {
    const slide = el[0];
    const leaf = slide && (slide.c || []).find((k) => typeof k !== 'string' && k.bgImg);
    return leaf ? leaf.bgImg : null;
  }
  return el.length === 1 ? slideshowBg(el[0]) : null;
}
const isBgLayer = (k) => typeof k !== 'string' && k.t === 'div' && ((!k.c && k.bgImg && k.s?.w >= (k.s?.pw || 0) - 2) || slideshowBg(k));

// ::before / ::after 的滿版遮罩 → 真實的絕對定位 div
function overlayHtml(o, kind) {
  if (!o) return '';
  const d = ['position:absolute', 'pointer-events:none', 'z-index:0'];
  const full = (v) => !v || v === '0px' || v === 'auto';
  d.push(`top:${o.top === 'auto' ? 0 : o.top};left:${o.left === 'auto' ? 0 : o.left}`);
  if (o.right !== 'auto' && o.bottom !== 'auto' || (!o.w || !o.h)) d.push(`right:${o.right === 'auto' ? 0 : o.right};bottom:${o.bottom === 'auto' ? 0 : o.bottom}`);
  else d.push(`width:${o.w};height:${o.h}`);
  if (o.bg && o.bg !== 'rgba(0, 0, 0, 0)') d.push(`background-color:${o.bg}`);
  if (o.img) {
    const img = o.img.replace(/url\(["']?([^"')]+)["']?\)/g, (_, u) => `url(${localImg(u)})`);
    d.push(`background-image:${img}`, `background-size:${o.size}`, `background-position:${o.pos}`, `background-repeat:${o.rep}`);
  }
  if (o.op !== '1') d.push(`opacity:${o.op}`);
  if (o.blend && o.blend !== 'normal') d.push(`mix-blend-mode:${o.blend}`);
  if (o.br && o.br !== '0px') d.push(`border-radius:${o.br}`);
  return `<div class="lay ${cls(d.join(';'))}"></div>`;
}

function render(n, parent) {
  if (typeof n === 'string') return esc(n);
  // 標記 dk 的節點：手機版面樹中嵌入的桌機區塊，沿用桌機規則（手機上會自動堆疊）
  if (n.dk && MOBILE) { MOBILE = false; try { return render(n, parent); } finally { MOBILE = true; } }
  const t = n.t;
  const s = n.s || {};
  if (t === 'br') return '<br>';
  if (t === 'i' && !n.c) return '';
  if (t === 'svg') {
    const sz = `width:${s.w || 24}px;height:${s.h || 24}px`;
    const svg = (n.svg || '').replace(/^<svg/, `<svg aria-hidden="true" style="${esc(sz)};max-width:100%"`);
    return svg;
  }
  if (t === 'img') {
    const src = localImg(n.src);
    const d = declFor(n, parent);
    const pc = parent?.s || {};
    const pw = parent ? Math.max(1, (pc.w || s.pw) - px(pc['padding-left']) - px(pc['padding-right'])) : s.pw, w = s.w;
    let extra = '';
    if (pw && w && w < pw - 2) extra = `width:${((w / pw) * 100).toFixed(2)}%;`;
    else extra = 'width:100%;';
    const c = cls(`${extra}max-width:${Math.max(w || 0, 0) || 99999}px;height:auto;${d}`.replace('max-width:99999px;', ''));
    const dim = n.nw && n.nh ? ` width="${n.nw}" height="${n.nh}"` : '';
    return `<img class="${c}" src="${esc(src)}"${dim} alt="${esc(n.alt || '')}" loading="lazy" decoding="async">`;
  }
  if (t === 'iframe') {
    const ratio = s.w && s.h ? `${s.w}/${s.h}` : '16/9';
    const c = cls(`width:100%;max-width:${s.w || 1140}px;aspect-ratio:${ratio};border:0;display:block;margin:0 auto${s.filter ? ';filter:' + s.filter : ''}`);
    return `<iframe class="${c}" src="${esc(n.src || '')}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }

  const ssBg = slideshowBg(n);
  if (ssBg) return `<div class="lay ${cls(`position:absolute;inset:0;z-index:0;background:url(${localImg(ssBg)}) 50% 50%/cover no-repeat`)}"></div>`;
  let decl = declFor(n, parent);
  const isLayer = t === 'div' && !n.c && n.bgImg && s.w && s.pw && s.w >= s.pw - 2 && !(s.position === 'absolute');
  if (isLayer) decl = decl.replace(/min-height:[^;]+;?/, '') + ';position:absolute;inset:0;z-index:0';
  const tokens = (n.cls || '').split(/\s+/);
  const isCar = tokens.includes('elementor-image-carousel') || tokens.includes('swiper-wrapper');
  const isSlide = parent && (parent.cls || '').split(/\s+/).some((x) => x === 'elementor-image-carousel' || x === 'swiper-wrapper');

  let inner = (n.c || []).map((k) => render(k, n)).join('');
  const hasOv = !!(n.pb || n.pa);
  if (hasOv) inner = overlayHtml(n.pb) + inner + overlayHtml(n.pa);

  // 沒有任何樣式的包裝層直接展開
  if (WRAP_OK.has(t) && !decl && !hasOv && !n.href && !isCar && !isSlide && (!s.w || !parent || Math.abs(s.w - ((parent.s.w || s.pw) - px(parent.s['padding-left']) - px(parent.s['padding-right']))) < 3)) return inner;

  // 判斷「橫排欄位」，手機改直排
  const kids = (n.c || []).filter((k) => typeof k !== 'string');
  const isRow = s.display === 'flex' && (s['flex-direction'] || 'row').startsWith('row') && kids.filter((k) => k.t === 'div' && k.s?.w >= 120).length >= 2;

  const absKids = kids.filter((k) => k.s && (k.s.position === 'absolute'));
  const isGal = kids.length >= 3 && absKids.length === kids.length && !isLayer;
  if (isGal && s.h) decl += `;min-height:${s.h}px;position:relative`;
  let c = cls(decl);
  const classes = [c];
  if (isGal) classes.push('gal');
  if (tokens.includes('elementor-tab-title')) classes.push('acc-t');
  if (tokens.includes('elementor-tab-content') && !n.open) classes.push('shut');
  if (n.dk) classes.push('doc-m', n.side === 'l' ? 'doc-l' : 'doc-r');
  if (isRow && !MOBILE) classes.push('r');
  if (isLayer) classes.push('lay');
  if (hasOv || kids.some(isBgLayer)) classes.push('hasl');
  if (isCar) classes.push('car');
  if (isSlide) { classes.push('slide'); const w = s.w || 400; classes.push(cls(`flex:0 0 ${w}px;width:${w}px;max-width:86%`)); }
  const attrs = [`class="${classes.filter(Boolean).join(' ')}"`];
  let tag = t;
  if (t === 'a') {
    const h = localHref(n.href);
    attrs.push(`href="${esc(h)}"`);
    if (isExternal(h)) attrs.push('target="_blank" rel="noopener"');
  }
  if (s.fill && t === 'svg') attrs.push(`fill="${s.fill}"`);
  if (VOID.has(tag)) return `<${tag} ${attrs.join(' ')}>`;
  return `<${tag} ${attrs.join(' ')}>${inner}</${tag}>`;
}

// ───────── 頁首 / 頁尾 / 外框 ─────────
const caret = '<svg class="caret" viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
function menuHtml(items, depth = 0) {
  return `<ul class="${depth ? 'sub' : 'nav'}">${items.map((it) => {
    const has = it.c?.length;
    const href = localHref(it.href);
    return `<li class="${has ? 'has-sub' : ''}"><a href="${esc(href)}">${esc(it.label)}${has ? caret : ''}</a>${has ? `<button class="tg" aria-label="展開子選單">${caret}</button>` + menuHtml(it.c, depth + 1) : ''}</li>`;
  }).join('')}</ul>`;
}
const icoIg = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8" fill="currentColor"/></svg>';
const icoFb = '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.300-.1-2.500-.1-2.500 0-4.200 1.500-4.200 4.300v2.200H7.400V13h2.700v8z"/></svg>';
const icoMail = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 7 8.5-7"/></svg>';
const icoChat = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 3C6.9 3 3 6.4 3 10.6c0 2.4 1.3 4.5 3.3 5.9L5.7 21l4.3-2.3c.7.1 1.3.2 2 .2 5.1 0 9-3.4 9-7.6S17.100 3 12 3z"/></svg>';

const header = `<a class="skip" href="#content">跳至主要內容</a>
<header class="hd" id="masthead"><div class="hd-in">
<a class="logo" href="/"><img src="${localImg(ORIGIN + '/wp-content/uploads/2024/02/LOGO_180X60_300.png')}" srcset="${localImg(ORIGIN + '/wp-content/uploads/2024/02/LOGO_180X60_300.png')} 1x, ${localImg(ORIGIN + '/wp-content/uploads/2024/02/LOGO_180X60_300_R.png')} 2x" width="180" height="60" alt="${SITE}"></a>
<button class="burger" aria-label="選單" aria-expanded="false"><span></span><span></span><span></span></button>
<nav class="mainnav" aria-label="主選單">${menuHtml(menu)}
<div class="soc"><a href="https://www.instagram.com/lithemed_clinic/" target="_blank" rel="noopener" aria-label="Instagram">${icoIg}</a><a href="https://www.facebook.com/profile.php?id=61555660705035" target="_blank" rel="noopener" aria-label="Facebook">${icoFb}</a><a href="mailto:lithemed@gmail.com" aria-label="Email">${icoMail}</a></div></nav>
</div></header>`;

const fab = `<div class="fab"><div class="fab-menu"><a href="https://lin.ee/LaNofeZ" target="_blank" rel="noopener">LINE</a><a href="https://m.me/61555660705035" target="_blank" rel="noopener">Messenger</a></div><button class="fab-btn" aria-label="聯絡我們" aria-expanded="false">${icoChat}</button></div>`;

function pageHtml(p, d) {
  const url = SITE_URL + '/' + (p.path ? p.path.split('/').map(encodeURIComponent).join('/') + '/' : '');
  const og = d.og ? localImg(d.og) : localImg(ORIGIN + '/wp-content/uploads/2024/02/lithemed_1200x675.png');
  MOBILE = false;
  let body = render(d.tree, null);
  if (d.treeM) {
    MOBILE = true;
    body = `<div class="dk">${body}</div><div class="mb">${render(d.treeM, null)}</div>`;
    MOBILE = false;
  }
  const robots = p.path === 'home-02' ? '<meta name="robots" content="noindex">' : '';
  return { url, body, head: `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.title || SITE)}</title>
<meta name="description" content="${esc(d.desc || '沐澄診所：醫學美容、抗老逆齡、整形手術、泌尿專科。')}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE}"><meta property="og:title" content="${esc(d.title || SITE)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE_URL}${og}">
${robots}
<link rel="icon" href="${localImg(ORIGIN + '/wp-content/uploads/2024/02/LOGO-3.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Noto+Serif+TC:wght@300;400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css?v=${ver['style.css']}">
<link rel="stylesheet" href="/assets/pages.css?v=PAGESCSS">` };
}

// ───────── 主流程 ─────────
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets', 'img'), { recursive: true });

const rendered = [];
for (const p of pagesIndex) {
  const d = JSON.parse(readFileSync(join(ROOT, 'content/pages', p.name + '.json'), 'utf8'));
  rendered.push({ p, r: pageHtml(p, d) });
}
// 去重後的樣式表（所有頁面共用，單一檔案利於快取）
const pagesCss = [...classOf].map(([decl, c]) => `.${c}{${decl}}`).join('\n');
const pagesVer = createHash('sha256').update(pagesCss).digest('hex').slice(0, 8);
writeFileSync(join(OUT, 'assets', 'pages.css'), pagesCss, 'utf8');

for (const { p, r } of rendered) {
  const html = `<!doctype html>
<html lang="zh-Hant"><head>
${r.head.replace('PAGESCSS', pagesVer)}
</head>
<body class="${p.path ? '' : 'home'}">
${header}
<main id="content">${r.body}</main>
${fab}
<script src="/assets/site.js?v=${ver['site.js']}" defer></script>
</body></html>
`;
  const dir = join(OUT, p.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
}

// 靜態資源
for (const f of readdirSync(ASSETS)) if (f !== 'img' && f !== '_redirects') copyFileSync(join(ASSETS, f), join(OUT, 'assets', f));
copyFileSync(join(ASSETS, '_redirects'), join(OUT, '_redirects')); // Pages 要求放在輸出目錄根
for (const f of readdirSync(join(ASSETS, 'img'))) copyFileSync(join(ASSETS, 'img', f), join(OUT, 'assets', 'img', f));

// 404 / sitemap / robots / headers
writeFileSync(join(OUT, '404.html'), `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>找不到頁面 - ${SITE}</title><link rel="stylesheet" href="/assets/style.css?v=${ver['style.css']}"></head><body class="nf"><main><h1>找不到這個頁面</h1><p><a href="/">回到首頁</a></p></main></body></html>`, 'utf8');
const urls = rendered.filter(({ p }) => p.path !== 'home-02').map(({ r }) => `<url><loc>${r.url}</loc></url>`).join('\n');
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, 'utf8');
writeFileSync(join(OUT, '_headers'), `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`, 'utf8');

console.log(`建置完成：${rendered.length} 頁，${classOf.size} 個樣式 class`);
