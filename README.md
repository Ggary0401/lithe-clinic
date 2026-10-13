# 沐澄診所 LITHE CLINIC 官網

複刻 https://lithe-med.com/ 的靜態網站：`npm run build` 產生純靜態 HTML，部署到 Cloudflare Pages。

## 指令
| 指令 | 用途 |
| --- | --- |
| `npm run build` | 產生 `public/` |
| `npm run preview` | 建置並在 http://localhost:4173 預覽 |
| `npm run dev` | 建置並用 wrangler 預覽（http://localhost:8788） |

## 專案結構
```
content/pages/*.json   每頁的版面樹（桌機 tree + 手機 treeM）
content/pages.json     頁面清單與網址路徑
content/menu.json      主選單
content/assets.json    原站圖片網址 → assets/img/ 檔名
assets/                style.css、site.js、img/
scripts/build.mjs      建置腳本（零外部依賴）
scripts/fetch-assets.mjs / shrink-assets.mjs   下載並壓縮原站圖片（一次性）
scripts/capture/       渲染原站、擷取版面、並排比對、全站檢查的工具
public/                建置輸出，由 Pages 部署
```

## 重新擷取原站
需要 macOS 的 Google Chrome 與 Node 22+。
```bash
node scripts/capture/cdp.mjs content/capture-list.json /tmp/out 1440   # 桌機
node scripts/capture/cdp.mjs content/capture-list.json /tmp/out 390    # 手機（輸出 *-m.json）
```
把輸出的 `tree` 分別放進 `content/pages/<名稱>.json` 的 `tree` / `treeM`，再 `node scripts/fetch-assets.mjs && node scripts/shrink-assets.mjs && npm run build`。

## 已知差異
- Elementor 的進場動畫、數字跳動、手風琴展開/收合、輪播自動播放沒有複刻（輪播改成可橫向滑動）。**手風琴收合中的內文原站是隱藏的，擷取時沒有抓到，目前只有標題列**（例如 /nsv/ 的「Q & A」），需要的話要補抓。
- 浮動聯絡鈕是展開 LINE / Messenger 兩個連結的簡化版。
- 頁面表單、留言等需要後端的功能原站沒有，也沒有複刻。
