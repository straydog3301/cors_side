# 🛠️ 《Cyber-Occult Repair Shop》開發排程與管理計畫

本文件針對 **1人業餘開發** 的情況進行評估。由於業餘開發時間碎片化且缺乏外部監督，核心策略為 **「MVP (最小可行性產品) 優先」** $\rightarrow$ **「垂直切片 (Vertical Slice)」** $\rightarrow$ **「內容填充」**。

---

## 📅 1. 整體時程評估
**預計開發週期**：6 - 10 個月（視內容產量而定）
**開發節奏**：以「週」為單位，每週投入 10-20 小時。

### 階段劃分
| 階段 | 目標 | 預計時長 | 核心交付物 |
| :--- | :--- | :--- | :--- |
| **Phase 1: 核心框架 (MVP)** | 建立最基礎的遊戲循環 | 1 - 2 個月 | 1 個維修關卡 $\rightarrow$ 1 次派遣 $\rightarrow$ 1 個購買流程 |
| **Phase 2: 系統深化 (Systems)** | 完成所有功能模組的聯動 | 2 - 3 個月 | 完整的經濟循環、新聞系統、角色屬性系統 |
| **Phase 3: 內容產出 (Content)** | 填充劇情、對話與數據表 | 2 - 3 個月 | 全線路劇本、所有維修訂單數據、派遣區域數據 |
| **Phase 4: 拋光與平衡 (Polish)** | UI 優化、數值微調、Bug 修復 | 1 - 2 個月 | 最終可玩版本 (Beta) |

---

## 📝 2. 詳細工項拆解 (WBS)

### Phase 1: 核心框架 $\rightarrow$ 打造「垂直切片」
*   **[基礎]** Unity 專案設定 $\&$ Naninovel 整合。
*   **[維修]** 實作 `faultPoints` 路徑邏輯 $\rightarrow$ 基礎點擊清除 $\rightarrow$ 限時計時器。
*   **[派遣]** 隨機節點路徑生成 $\rightarrow$ 基礎屬性判定 $\rightarrow$ 簡單物資掉落。
*   **[UI]** 基礎 OS 介面 (主畫面 $\rightarrow$ 維修畫面 $\rightarrow$ 派遣畫面)。
*   **[循環]** 完成一次 $\text{維修} \rightarrow \text{獲利} \rightarrow \text{派遣}$ 的最簡閉環。

### Phase 2: 系統深化 $\rightarrow$ 建立「遊戲骨架」
*   **[經濟]** 實作 `PendingOrder` 物流延遲系統 $\rightarrow$ 商店購買 $\rightarrow$ 資金追蹤。
*   **[環境]** `NewsService` 每日變數生成 $\rightarrow$ 修正項 (`DailyModifierData`) 對派遣的影響。
*   **[角色]** 角色屬性數據結構 $\rightarrow$ 屬性成長邏輯 $\rightarrow$ 好感度/忠誠度變數紀錄。
*   **[數據]** 建立 JSON/ScriptableObject 數據庫 (訂單庫、物資庫、區域庫)。

### Phase 3: 內容產出 $\rightarrow$ 注入「遊戲靈魂」
*   **[劇本]** 共通路線 $\rightarrow$ 分歧路線 $\rightarrow$ 結局對話的 Naninovel 腳本編寫。
*   **[關卡]** 設計 20-30 個不同難度的維修訂單 (座標路徑 $\&$ 障礙物)。
*   **[世界]** 設計多個派遣區域 (`DispatchZoneData`) 與節點池。
*   **[素材]** UI 圖像替換 $\rightarrow$ 角色立繪 $\rightarrow$ 基礎音效/BGM 導入。

### Phase 4: 拋光與平衡 $\rightarrow$ 達到「可發布狀態」
*   **[平衡]** 調整 TU 消耗公式 $\rightarrow$ 調整物資掉落率 $\rightarrow$ 調整保護費壓力。
*   **[優化]** OS 介面動畫 $\rightarrow$ 維修小遊戲的視覺回饋 $\rightarrow$ 文本校對。
*   **[測試]** 完整跑通三條主線 $\rightarrow$ 壓力測試 (連續遊玩 28 天) $\rightarrow$ 修復崩潰 Bug。

---

## 🚀 3. 單人開發監督與管理方案

單人開發最怕的是 **「陷入細節 (Over-engineering)」** 或 **「喪失動力 (Burnout)」**。

### A. 任務管理：看板法 (Kanban)
建議使用 Trello 或 Notion 建立三個清單：
1.  **Backlog (待辦)**：所有想到的功能（不要管優先級，先全部寫下來）。
2.  **This Week (本週)**：從 Backlog 挑選 **3 個核心任務**。**絕對不要超過 3 個**，避免壓力過大。
3.  **Done (已完成)**：記錄成就感。

### B. 開發狀態監督指標
每週日進行一次 **「狀態自檢」**：
*   **功能完成度**：本週計畫的 3 個任務是否完成？ (若未完成 $\rightarrow$ 分析原因 $\rightarrow$ 縮減下週目標)。
*   **可玩性檢查**：目前版本是否能從開始玩到某個點而沒有崩潰？
*   **開發熱情**：目前是否對某個功能感到厭煩？ (若是 $\rightarrow$ 暫停該模組，跳到另一 Phase 的簡單任務，如：寫對話)。

### C. 抗風險策略 (Risk Mitigation)
*   **拒絕完美主義**：在 Phase 1 & 2，使用「方塊」代替立繪，使用「文字」代替動畫。**先讓功能動起來，再讓它好看。**
*   **設定「功能凍結日 (Feature Freeze)」**：進入 Phase 4 後，禁止增加任何新功能，只允許修 Bug 和調數值。
*   **模組化開發**：確保維修、派遣、經營三個系統盡量解耦，方便單獨測試與修改。

---

## 🚩 4. 關鍵里程碑 (Milestones)
*   **M1 (MVP 完成)**：能完成一次維修並獲得金錢。
*   **M2 (循環完成)**：能利用金錢購買物資並派遣角色獲取資源。
*   **M3 (數值閉環)**：能完整體驗 7 天的遊戲循環（含新聞、屬性變動）。
*   **M4 (劇本通關)**：能從 Day 1 玩到 Day 28 並觸發某個結局。

---

## 📂 5. 詳細工項拆解清單 (Asset & Task Breakdown)

本章節將任務細分至可外包/委託的單元。每個項目的交付物需明確。

### 🎨 視覺藝術 (Visual Arts) - *適合委託繪師*
*   **角色立繪 (Character Sprites)**
    *   `MC`: 基礎立繪 $\times 1$。
    *   `Xavier`: 基礎立繪 $\times 1$ + 表情差 (喜, 怒, 哀, 樂, 誘惑/色慾狀態) $\times 5\text{--}8$ 種。
    *   `Lycaon`: 基礎立繪 $\times 1$ + 表情差 (忠誠, 狂暴, 委屈, 溫柔) $\times 5\text{--}8$ 種。
    *   `NPCs`: 王大師, Viper 等基礎立繪 $\times 2\text{--}3$ 名。
*   **故事 CG (Event CGs)**
    *   共通路線關鍵事件 $\times 3\text{--}5$ 張。
    *   Xavier 專屬路線 (情感深化/結局) $\times 3\text{--}5$ 張。
    *   Lycaon 專屬路線 (情感深化/結局) $\times 3\text{--}5$ 張。
*   **場景背景 (Backgrounds)**
    *   靈樞堂店內 (主視角) $\times 1$。
    *   地下區 13 號街 (街道視角) $\times 1$。
    *   派遣區域示意圖/背景 $\times 3\text{--}5$ 個。
*   **系統 UI 介面 (UI Design)**
    *   OS 主桌面設計 $\times 1$。
    *   App 介面：Email, News, Shop, Dispatch $\times 4$ 套。
    *   維修小遊戲介面 (HUD, 能量條, 故障點視覺效果) $\times 1$ 套。
    *   對話視窗/名稱欄設計 $\times 1$ 套。

### ✍️ 敘事與文本 (Narrative & Writing) - *適合劇本作者*
*   **主線劇本 (Main Scripts)**
    *   共通路線 (Day 1-21)：包含所有日常互動 $\&$ 關鍵轉折。
    *   Xavier 路線 (Day 21-28)：分支對話 $\rightarrow$ 結局文本。
    *   Lycaon 路線 (Day 21-28)：分支對話 $\rightarrow$ 結局文本。
*   **系統文本 (System Text)**
    *   物資/設備名稱與描述 $\times 50+$ 條。
    *   每日新聞 (Social News) 隨機文本池 $\times 100+$ 條。
    *   派遣節點事件描述 $\times 50+$ 條。
*   **角色設定集 (Lore)**：用於統一對話口吻的角色指南 (Character Guide)。

### ⚙️ 系統開發 (Technical/Code) - *核心開發/外包程式師*
*   **UI 框架**：
    *   實作 OS App 切換系統。
    *   實作 Naninovel 與自定義 UI 的數據同步介面。
*   **維修模組**：
    *   路徑生成算法 $\rightarrow$ 碰撞檢測 $\rightarrow$ 成功/失敗判定邏輯。
*   **派遣模組**：
    *   隨機路徑生成器 $\rightarrow$ 屬性檢定系統 $\rightarrow$ 掉落概率計算。
*   **數據管理**：
    *   儲存/讀取系統 (Save/Load)。
    *   JSON 數據解析器 (用於導入訂單、物資、區域數據)。

### 📐 關卡與數值設計 (Level & Balance Design) - *企劃/設計*
*   **維修關卡設計**：
    *   設計 30 個 `OrderData` (定義故障點座標、障礙物、時限)。
*   **派遣區域設計**：
    *   設計 3-5 個 `DispatchZoneData` (定義節點池、Boss 節點)。
*   **數值平衡表**：
    *   角色基礎屬性 $\rightarrow$ 成長曲線 $\rightarrow$ 物資價格 $\rightarrow$ 掉落率。

### 🎵 音效與音樂 (Audio) - *適合委託音效師*
*   **BGM (背景音樂)**：
    *   店鋪日常 (Chill/Lo-fi Cyberpunk) $\times 1$。
    *   派遣緊張感 (Ambient/Industrial) $\times 1$。
    *   情感高潮/結局 (Emotional/Melodic) $\times 2$。
*   **SFX (音效)**：
    *   UI 點擊音/切換音 $\times 5\text{--}10$ 種。
    *   維修成功/失敗音 $\times 2$ 種。
    *   派遣戰鬥/獲物音 $\times 3\text{--}5$ 種。
