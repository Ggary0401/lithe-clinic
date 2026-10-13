# lithe-clinic — 給 AI agent 的作業須知

沐澄診所 LITHE CLINIC 官方網站，正式網址 **https://lithe-med.com**。
由原本的 WordPress / Elementor 站複刻而來（2026-10 已取代原站上線）。
建站流程比照 clinical-pearls：零依賴 node 腳本 → `public/` 靜態檔 → Cloudflare Pages。

## 🚨 絕對不要編輯 `public/`

`scripts/build.mjs` 每次都會先清空 `public/` 再重建，改了也是白做工。

| 想改什麼 | 改這裡 |
|---|---|
| 頁面文字、圖片、連結 | `content/pages/<名稱>.json`（版面樹，見下） |
| 主選單 | `content/menu.json` |
| 頁首、頁尾、浮動聯絡鈕、整體 CSS / JS | `scripts/build.mjs`、`assets/style.css`、`assets/site.js` |
| 圖片 | `assets/img/`，並在 `content/assets.json` 對應原站網址 |

改完一律 `npm run build`，並把 `public/` 一起提交。

## 🚨 推送 = 正式站立即上線
`main` 推上 GitHub（Ggary0401/lithe-clinic）會觸發 Cloudflare Pages 自動部署，約一分鐘後 lithe-med.com 就是新版，沒有預備環境。
除非使用者明確說要推，否則只 commit 不 push。

## 網域與部署（2026-10-13 設定）
| 項目 | 狀態 |
|---|---|
| 正式網域 | `lithe-med.com`（向 WordPress.com / Automattic 註冊，自動續約，2027-01 到期；名稱伺服器已改為 Cloudflare） |
| 別名網域 | `lithe-clinic.com`（Cloudflare Registrar，2027-10-13 到期），以 Redirect Rule 301 轉到 `https://lithe-med.com` + 原路徑 |
| www | `www.lithe-med.com`、`www.lithe-clinic.com` 皆 301 轉到網域本體 |
| Pages 專案 | `lithe-clinic`（`lithe-clinic.pages.dev`），輸出目錄 `public`，不跑 build 指令，所以 **`public/` 必須提交** |
| Search Console | `lithe-med.com` 資源，只提交 `https://lithe-med.com/sitemap.xml` |

- DNS 裡那筆 `google-site-verification` TXT 是 Search Console 的擁有權驗證，**不要刪**。
- 網域上沒有設定 Email（沒有 MX）。
- `SITE_URL`（`scripts/build.mjs`）決定 canonical / og / sitemap 的網址；`ORIGIN` 只用來對應原站圖片網址。
- `assets/_redirects` 會被複製到 `public/_redirects`：處理原站有、新站沒有的網址（文章、分類、作者、舊 sitemap）→ 首頁或 `/sitemap.xml`。
- **待辦**：WordPress.com 商用版方案（NT$9,588/年，2026-12-26 自動續約）尚未取消，取消前先匯出備份；網域註冊（NT$423/年）要保留。

## 內容怎麼存的
每頁一個 JSON：`tree`（桌機版面樹）與 `treeM`（手機版面樹，≤767px 顯示）。
節點欄位：`t` 標籤、`s` 樣式、`c` 子節點、`bgImg` 背景圖、`src` 圖片、`href` 連結、`pb`/`pa` 為 `::before`/`::after` 遮罩。
`build.mjs` 把相同樣式去重成 `pages.css` 的 `.zN` class。要改字，直接在 JSON 搜尋該段文字。
資料原本由 `scripts/capture/` 用無頭 Chrome 渲染原站擷取（需 macOS 的 Google Chrome）；
手風琴面板原站預設隱藏，擷取時由 `extract.js` 強制展開並用 `open` 記錄預設狀態；渲染端為 `.acc-t`（標題）/ `.shut`（收合內文），開合在 `site.js`。
`content/capture-list.json` 是頁面清單。若原站更新想重抓，見 README。

## 慣例
- 零外部依賴。`build.mjs` 只用 node 內建模組。
- 手機優先：頁面本身不得出現橫向捲軸（`main{overflow-x:clip}`）。
- assets 自動帶內容雜湊（`?v=`）。
- 原站頁尾有 8 個連到 404 的中文網址，`build.mjs` 的 `FIXED` 表已改指向正確頁面。
- commit 訊息用中文。

## 驗證
1. `npm run build` 無錯誤
2. `npm run preview` 後（http://localhost:4173）跑 `node scripts/capture/check.mjs`：檢查 375/800/1440 寬度的橫向捲軸、破圖、站內失效連結
3. 與原站並排比對：`node scripts/capture/compare.mjs /spirit/ 1440`（輸出到 `.cmp/`）
