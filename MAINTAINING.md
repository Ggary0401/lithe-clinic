# 沐澄診所網站維護說明（給同仁）

你不需要會寫程式。安裝好之後，在 Codex 裡用中文說你要改什麼，Codex 會自己改、檢查，最後問你要不要發佈。

正式網站：https://lithe-med.com

---

## 一、第一次設定（只做一次，約 20 分鐘）

### 1. 安裝兩個軟體（Windows 也可以在 PowerShell 輸入 `winget install --id Git.Git` 安裝 Git）
| 軟體 | 用途 | 下載 |
|---|---|---|
| **Git** | 把網站檔案抓到你的電腦、把修改送出去 | https://git-scm.com/downloads |
| **Node.js**（選 LTS 版本） | 讓網站建置工具能執行 | https://nodejs.org |

安裝時一路按「下一步」即可（Windows 的 Git 安裝程式保持預設選項）。
裝好後，**重新開機一次**，確保電腦認得這兩個程式。

### 2. 有 GitHub 帳號並接受邀請
- 沒有帳號：到 https://github.com 免費註冊，記下你的**使用者名稱**，告訴網站管理者。
- 管理者邀請你之後，你的 Email 會收到一封信，點信裡的 **Accept invitation**。

### 3. 登入 GitHub（讓你的電腦有權限送出修改）
安裝 GitHub CLI：https://cli.github.com ，裝好後打開「終端機」（Mac）或「PowerShell」（Windows），輸入：

```bash
gh auth login
```

依畫面選：`GitHub.com` → `HTTPS` → `Yes`（使用 GitHub 認證 git）→ `Login with a web browser`。
它會給你一組驗證碼，瀏覽器打開後貼上、按核准即可。

接著設定你的名字與信箱（會顯示在每次修改紀錄上）：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的信箱"
```

### 4. 把網站檔案抓到你的電腦
在終端機輸入（Windows 建議先建立 `C:\work` 資料夾，用 `cd C:\work` 切過去，路徑避開中文）：

```bash
git clone https://github.com/Ggary0401/lithe-clinic.git
```

完成後會多出一個 `lithe-clinic` 資料夾。

### 5. 在 Codex 桌面版新增這個專案
Codex 左邊的側邊欄裡，有**資料夾圖示**的項目就是「專案」，每個專案對應電腦上的一個資料夾。

1. 在 Codex 按 **Add new project**（中文介面可能叫「新增專案」），或按鍵盤 **Ctrl + O**（Mac 是 **Cmd + O**）。
2. 在跳出的視窗選擇剛才下載的 `lithe-clinic` 資料夾。
3. 專案出現在側邊欄後，在這個專案底下開一個**新對話**，之後的維護都在這裡進行。
4. Codex 會自動讀資料夾裡的 `AGENTS.md`，知道怎麼維護這個網站，你不需要再教它。

小提醒：
- **Windows 的資料夾路徑請避開中文**（例如放在 `C:\work\lithe-clinic`）。已有使用者回報，Windows 使用者名稱含中文時，Codex 選資料夾可能出錯；網站工具本身沒有這個問題。
- 輸入框下方有「權限」選項。如果目前是「完整存取權」，代表 Codex 在你的電腦上幾乎什麼都能做，官方也提醒可能造成資料遺失。維護這個網站建議改成 **Ask for approval**（需要核准），Codex 要連網發佈時會問你，你按允許即可。

### 6. 試跑一次（確認一切正常）
對 Codex 說：

> 請幫我檢查網站環境是否正常（執行建置與檢查），不要修改任何內容，也不要發佈。

看到「✓ 檢查 55 頁：站內連結、圖片、canonical 都正常」就代表設定成功。

---

## 二、日常使用

直接用白話說需求，例如：

- 「把醫學美容頁第一段文字改成：……」
- 「把首頁第二張圖換成這張」（把圖片檔案拖進對話，或貼上路徑）
- 「全站的診所電話改成 04-2320-0101，先告訴我會影響幾個頁面」
- 「把聯繫頁的 Email 換成……」
- 「我想知道『玻尿酸』這個詞出現在哪些頁面」

Codex 會：
1. 找到要改的地方，先告訴你會影響哪幾頁；
2. 修改並自動檢查；
3. 用白話告訴你改了什麼，然後**問你要不要發佈**；
4. 你說「發佈」之後才會上線，約一分鐘後生效。

**每次開始前**，請對 Codex 說一句：「先把最新版本同步下來」，避免和別人的修改衝突。

---

## 三、Codex 做不到的事（請找管理者）
- 新增整頁、新增版型區塊、調整整體排版
- 網域、DNS、Cloudflare、Google Search Console 的設定
- 發佈後發現網站壞掉，需要**回到上一個版本**：請立刻聯絡管理者（他可以在 Cloudflare 後台一鍵還原）

## 四、注意事項
- **發佈 = 立刻更新正式網站**，沒有審核流程。發佈前請自己確認 Codex 說明的修改內容。
- 涉及療效、價格、前後對照、案例見證的文字，請注意醫療廣告相關規範。
- 不要在對話中貼密碼或金鑰。
- 圖片請盡量先縮小（單張建議 1.5MB 以下）。工具會自動縮圖（Mac、Windows 都有），但手機直拍的超大照片仍建議先縮小。
- 兩個人不要同時修改同一頁；如果 Codex 說遇到「衝突」，**停下來**，找管理者。

## 五、常見問題
| 狀況 | 怎麼辦 |
|---|---|
| Codex 說「找不到 npm / node」 | Node.js 沒裝好，重新安裝後重新開機 |
| **Windows**：出現「因為這個系統上已停用指令碼執行」或 `npm.ps1` | 打開 PowerShell，輸入 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`，問你時按 `Y`，再重新開啟 Codex |
| **Windows**：看預覽時瀏覽器打不開 | 對 Codex 說「用 npm run serve 開預覽」，再開 http://localhost:4173，看完請 Codex 關掉 |
| 發佈時出現「network / permission」或要你核准 | 這是 Codex 的安全機制，按「允許」再重試 |
| 發佈時要求登入 GitHub | 重新執行第 3 步的 `gh auth login` |
| 改了文字但網站沒變 | 等 1～2 分鐘，並用瀏覽器強制重新整理；仍沒變就問 Codex「剛才有成功發佈嗎」 |
| Codex 說「找不到這段文字」 | 那段文字可能被換行或粗體切成幾段，請 Codex 分段尋找 |
