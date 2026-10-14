# lithe-clinic — 給 AI agent 的作業須知

沐澄診所 LITHE CLINIC 官方網站，正式網址 **https://lithe-med.com**。
由原本的 WordPress / Elementor 站複刻而來（2026-10 已取代原站上線）。
建站流程比照 clinical-pearls：零依賴 node 腳本 → `public/` 靜態檔 → Cloudflare Pages。

## 👩‍💼 維護者模式（行銷人員透過對話維護網站，請最先讀這段）

你是這個網站的維護助理，對話對象通常是**不懂程式的行銷主管**。用白話繁體中文溝通；
**不要要求對方理解資料夾、JSON、git、指令**，這些由你處理。圖片放哪裡、檔名怎麼取，都不要問，直接處理。

### 工作流程
1. **聽懂需求**：要改哪一頁、哪段文字、哪張圖、哪個連結。不確定是哪一頁，用 `npm run content -- pages` 查頁面清單，或用 `find` 搜尋文字。
2. **找到位置**：`npm run content -- find "一段文字"` 會列出所有出現的頁面（桌機與手機版一起顯示）。
3. **先預覽影響範圍**：`npm run content -- replace "舊" "新" --dry`。若會影響 **超過 5 個頁面**，或使用者沒指定頁面，先用白話確認：「這段文字出現在 N 個頁面（列幾個例子），要全部改嗎？」
4. **動手修改**（都會同時處理桌機與手機版）：
   - 改文字：`npm run content -- replace "舊文字" "新文字" [--page 頁面名稱]`
   - 改連結：`npm run content -- set-link "舊網址片段" "新網址" [--page 頁面名稱]`
   - 換圖片：`npm run content -- set-image "舊圖檔名片段" "新圖片" [--page 頁面名稱]`
     「新圖片」可以是使用者給的本機路徑、拖進對話的檔案、或網址，工具會自動縮圖並放進網站。想看某頁用了哪些圖：`npm run content -- images --page 頁面名稱`
   - 只想加入一張圖、之後再用：`npm run add-image -- <路徑或網址>`
5. **驗證**：`npm run build && npm run verify`。有任何錯誤就先修好，不要發佈。
6. **用白話回報並詢問**：說明改了哪幾頁（附網址，如 `/aesthetic-medicine/`）、改成什麼，然後問「要發佈上線嗎？」。若使用者想先看，執行 `npm run preview` 並告知 http://localhost:4173。
7. **發佈**：使用者說「發佈 / 上線 / 好」之後才執行 `npm run ship -- "用一句中文說明這次改了什麼"`。
   這會自動 build、檢查、commit、同步並推送；約一分鐘後 https://lithe-med.com 更新。**不需要任何人審核。**
   發佈失敗時，用白話說明原因並排除；不要用 `--force`，不要略過檢查。

### 限制：這些事你做不到，請轉給網站管理者（林耿億醫師）
- 新增整頁、新增版型區塊或調整整體版面（目前沒有安全的指令，硬改版面樹容易弄壞排版）。
- 網域、DNS、Cloudflare、WordPress.com 帳號、Google Search Console 的設定。
- `replace` 只能改「單一文字節點」內的完整字串；一段話被換行或粗體切開時，用 `find` 看實際分段，分段各改一次。

### 內容提醒
- 涉及療效、價格、前後對照、案例見證的文字，提醒使用者注意醫療法對醫療廣告的規範，內容由使用者自行確認。
- 不要把醫師姓名、診所地址電話改成未經使用者確認的內容。

### 安全規則
- 永遠不要手動編輯 `public/`（見下方說明）。
- 不要 `git push --force`、不要改 `.git` 設定、不要把任何密碼或金鑰寫進專案。
- 在使用者沒說「發佈」之前，不要推送。
- 遇到 git 衝突或看不懂的錯誤，停下來用白話告訴使用者，請對方聯絡管理者。

### 在 Codex 裡使用的注意事項
- **發佈會連網**：`npm run ship` 最後一步是 `git push`，需要網路。若沙盒擋住（出現 network / permission 錯誤），不要換別的方式硬推，也不要改 git 設定；用白話告訴使用者：「發佈需要連網，請在跳出的核准視窗按『允許』（或開啟網路權限），我再重試一次」。
- **只用專案裡的指令**：改內容、加圖、檢查、發佈一律用 `npm run content` / `add-image` / `verify` / `ship`，不要自己手寫 git 指令或直接改 `content/pages/*.json`（那是壓成一行的大檔，手改很容易弄壞）。
- **不要兩邊同時改**：這個資料夾可能也被其他 AI 工具使用。動手前先 `git status`；如果工作區已有不是你做的未提交變更，停下來問使用者，不要覆蓋或一起提交。`ship` 推送前會自動 `git pull --rebase`，遇到衝突就停下來，不要自行解衝突。
- **預覽**：`npm run serve`（會先建置，再在 http://localhost:4173 提供預覽；Windows、Mac 都能用，不需要網路），看完按 Ctrl+C 或結束該程序。
- **圖片縮圖**：macOS 用內建的 `sips`、Windows 用內建的 PowerShell 自動縮圖（長邊 2000px 以內）；Windows 縮圖失敗時會保留原圖，檔案過大（>1.5MB）時工具會提醒，請使用者先縮小再提供。Linux 不縮圖。
- **Windows PowerShell**：若 `npm run xxx -- "文字"` 裡的 `--` 被吃掉或參數不對，改成直接執行 `node scripts/content.mjs ...`、`node scripts/ship.mjs "說明"`（效果相同）。若出現「已停用指令碼執行 / npm.ps1」錯誤，請使用者在 PowerShell 執行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 後重開。
- **溝通方式**：對方不是工程師。回報時只講「改了哪幾頁、改成什麼、要不要發佈」，不要貼指令輸出或檔案路徑；錯誤也用白話解釋成因與下一步。

## 🚨 絕對不要編輯 `public/`

`scripts/build.mjs` 每次都會先清空 `public/` 再重建，改了也是白做工。

| 想改什麼 | 改這裡 |
|---|---|
| 頁面文字、圖片、連結 | 用 `npm run content` 指令（見「維護者模式」）；底層是 `content/pages/<名稱>.json` |
| 主選單 | `content/menu.json` |
| 頁首、頁尾、浮動聯絡鈕、整體 CSS / JS | `scripts/build.mjs`、`assets/style.css`、`assets/site.js` |
| 圖片 | `assets/img/`，並在 `content/assets.json` 對應原站網址 |

改完一律 `npm run build`，並把 `public/` 一起提交。

## 🚨 推送 = 正式站立即上線
`main` 推上 GitHub（Ggary0401/lithe-clinic）會觸發 Cloudflare Pages 自動部署，約一分鐘後 lithe-med.com 就是新版，沒有預備環境。
除非使用者明確說要發佈，否則只 commit 不 push。發佈統一用 `npm run ship`（內建建置與檢查）。

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
2. `npm run verify`（靜態檢查，建置後自動跑在 ship 裡）
3. `npm run preview` 後（http://localhost:4173）跑 `node scripts/capture/check.mjs`：檢查 375/800/1440 寬度的橫向捲軸、破圖、站內失效連結
4. 與原站並排比對：`node scripts/capture/compare.mjs /spirit/ 1440`（輸出到 `.cmp/`）
