# 沐澄診所 LITHE CLINIC 官網

沐澄診所官方網站（https://lithe-med.com）。由原 WordPress 站複刻成靜態網站：`npm run build` 產生純靜態 HTML，推上 GitHub 後由 Cloudflare Pages 自動部署。

## 指令
| 指令 | 用途 |
| --- | --- |
| `npm run build` | 產生 `public/` |
| `npm run preview` | 建置並在 http://localhost:4173 預覽 |
| `npm run dev` | 建置並用 wrangler 預覽（http://localhost:8788） |

## 日常維護（行銷人員用 Codex 對話即可）
在 Codex 開啟專案後直接說需求，例如「把醫學美容頁的第一段改成……」「把首頁第二張圖換成這張」。
Codex 會依 `AGENTS.md` 自動處理：找位置、改文字／連結／圖片、建置與檢查，最後問你是否發佈。
對應的指令：

| 指令 | 用途 |
| --- | --- |
| `npm run content -- find "文字"` | 找出文字在哪些頁面 |
| `npm run content -- replace "舊" "新" [--page 名稱] [--dry]` | 改文字（`--dry` 只預覽） |
| `npm run content -- set-link "舊" "新"` | 改連結 |
| `npm run content -- set-image "舊圖檔名" "新圖片路徑或網址"` | 換圖（自動縮圖、自動放入網站） |
| `npm run verify` | 檢查站內連結與圖片 |
| `npm run ship -- "說明"` | 建置 → 檢查 → commit → push，一鍵發佈 |

## 網域與部署
- 正式網址 `lithe-med.com`；`lithe-clinic.com`、`www.*` 以 301 轉到它。
- Pages 專案 `lithe-clinic` 連到 GitHub `Ggary0401/lithe-clinic` 的 `main`，輸出目錄 `public`（不跑 build，需提交 `public/`）。
- 推 `main` 即上線。`assets/_redirects` 負責舊 WordPress 網址的 301。
- 詳細設定與待辦見 [AGENTS.md](AGENTS.md)。

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
assets/_redirects      舊網址 301 規則（建置時複製到 public/）
public/                建置輸出，由 Pages 部署
```

## 重新擷取原站（原站已退役，僅供日後參考）
需要 macOS 的 Google Chrome 與 Node 22+。
```bash
node scripts/capture/cdp.mjs content/capture-list.json /tmp/out 1440   # 桌機
node scripts/capture/cdp.mjs content/capture-list.json /tmp/out 390    # 手機（輸出 *-m.json）
```
把輸出的 `tree` 分別放進 `content/pages/<名稱>.json` 的 `tree` / `treeM`，再 `node scripts/fetch-assets.mjs && node scripts/shrink-assets.mjs && npm run build`。

## 已知差異
- Elementor 的進場動畫、數字跳動、輪播自動播放沒有複刻（輪播改成可橫向滑動）。
- 手風琴（Q & A）可點擊展開 / 收合。原站有些頁面的面板本來就是空的（例如 /nsv/），所以展開後沒有內容，與原站一致。
- 浮動聯絡鈕是展開 LINE / Messenger 兩個連結的簡化版。
- 頁面表單、留言等需要後端的功能原站沒有，也沒有複刻。
