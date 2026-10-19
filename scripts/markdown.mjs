// 文章用的極簡 Markdown 轉 HTML（零依賴）。只支援文章會用到的語法：
//   ## 標題、### 小標題、段落、- 清單、1. 清單、> 引言、---（分隔線）、
//   **粗體**、*斜體*、[文字](網址)、![說明](圖片)
// 所有文字先跳脫，不允許直接寫 HTML；連結只接受 http(s)、mailto、站內路徑與 #錨點。
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeUrl = (u) => (/^(https?:\/\/|mailto:|\/|#)/.test(u.trim()) ? u.trim() : '#');

function inline(s) {
  let out = esc(s);
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${esc(safeUrl(src))}" alt="${alt}" loading="lazy" decoding="async">`);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const h = safeUrl(u);
    const ext = /^https?:\/\//.test(h) && !h.startsWith('https://lithe-med.com');
    return `<a href="${esc(h)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return out;
}

export function markdownToHtml(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{2,3})\s+(.+)$/))) { html.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; continue; }
    if (/^---+\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      html.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }
    if (/^([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^([-*]|\d+\.)\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^([-*]|\d+\.)\s+/, ''))}</li>`);
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/))) {
      html.push(`<figure><img src="${esc(safeUrl(m[2]))}" alt="${esc(m[1])}" loading="lazy" decoding="async">${m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : ''}</figure>`);
      i++;
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|>|---+\s*$|([-*]|\d+\.)\s+)/.test(lines[i])) buf.push(lines[i++]);
    html.push(`<p>${buf.map(inline).join('<br>')}</p>`);
  }
  return html.join('\n');
}

// 解析「---」包起來的檔頭（title、date、desc、cover），回傳 { meta, body }
export function parseArticle(text) {
  const m = text.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('文章檔案開頭要有 --- 包起來的檔頭（title、date、desc、cover）');
  const meta = {};
  for (const l of m[1].split('\n')) {
    const k = l.match(/^(\w+):\s*(.*)$/);
    if (k) meta[k[1]] = k[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return { meta, body: m[2].trim() };
}
