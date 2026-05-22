# 🛠️ 《Cyber-Occult Repair Shop》系統規格書 (System Specification)

本文檔旨在定義遊戲中所有核心數據結構的規格，為數值企劃與內容設計提供統一的公版與範例。所有數據定義均與 `~/hermes/Scripts/Data` 下的 C# 類定義同步。

---

## 1. 維修訂單系統 (Order System)
維修訂單定義了核心小遊戲的關卡構造與獎勵。

### 1.1 數據規格：`OrderData`
| 字段 | 類型 | 說明 | 數值建議/範例 |
| :--- | :--- | :--- | :--- |
| `orderID` | `string` | 訂單唯一標識符 | `order_basic_01` |
| `clientName` | `string` | 客戶顯示名稱 | 「地下區拾荒者」 |
| `rewardAmount` | `int` | 完成後獲得的金錢 | 500 ~ 5000 |
| `faultPoints` | `Vector2[]` | 故障路徑點座標 (Local Position) | `[(0,0), (1,2), (3,1)]` |
| `waypoints` | `List<WaypointInfo>` | 路徑中的特殊節點（存檔點、加時點） | 詳見 1.2 |
| `obstacles` | `List<ObstacleInfo>` | 路徑上的障礙物（造成傷害/干擾） | 詳見 1.2 |
| `durationHours` | `int` | 訂單在遊戲世界中消耗的小時數 | 0 ~ 8 |
| `staminaCost` | `int` | 啟動維修消耗的體力 | 10 ~ 50 |
| `timeLimit` | `int` | 小遊戲限時 (秒)，0 為不限時 | 60 ~ 300 |
| `pathWidth` | `float` | 道路寬度 (影響操作難度) | 0.3 ~ 0.7 |
| `startDialogueID` | `string` | 接單時觸發的對話 ID | `dlg_order_01_start` |
| `successDialogueID` | `string` | 完成後觸發的對話 ID | `Story/Day1` |
| `isPathMoving` | `bool` | 路徑是否為動態移動 | `true` / `false` |
| `moveMagnitude` | `float` | 路徑移動幅度 | 0.1 ~ 0.3 |
| `moveSpeed` | `float` | 路徑移動速度 | 1 ~ 5 |
| `itemSprite` | `Sprite` | 訂單道具圖示（可為空） | - |
| `itemAnimationFrames` | `Sprite[]` | 動畫序列幀 | - |
| `animationFPS` | `int` | 動畫幀率 | 6 |
| `customBackground` | `Sprite` | 自定義背景圖（可為空） | - |

### 1.2 輔助數據：`WaypointInfo` 與 `ObstacleInfo`
- **`WaypointInfo` (路徑特殊點)**:
    - `pointIndex`: 對應 `faultPoints` 的索引。
    - `type`: `Normal` (普通, type=0), `Checkpoint` (存檔, type=1), `TimeBonus` (加時, type=2)。
    - `extraTime`: 若為 `TimeBonus` 時增加的秒數。
    - `triggerByClick`: 是否需要點擊觸發。
    - `segmentWidth`: 該節點處的道路寬度覆寫值（0 表示使用預設 `pathWidth`）。
    - `animationFrames`: 動畫序列幀（可為空）。
- **`ObstacleInfo` (障礙物)**:
    - `position`: 座標 (Vector2)。
    - `damage`: 碰撞後扣除的生命值。
    - `moveOffset`: 移動軌跡偏移量。
    - `moveSpeed`: 移動速度。
    - `animationFrames`: 動畫序列幀。

### 📦 維修訂單範例 (JSON 形式)
```json
{
  "orderID": "order_cyber_eye_01",
  "clientName": "被遺棄的義眼",
  "rewardAmount": 1200,
  "faultPoints": [[0,0], [1,1], [2,0], [3,1], [4,0]],
  "waypoints": [
    { "pointIndex": 2, "type": "Checkpoint", "triggerByClick": false },
    { "pointIndex": 4, "type": "Normal", "triggerByClick": true }
  ],
  "timeLimit": 120,
  "pathWidth": 0.5
}
```

---

## 2. 派遣系統 (Dispatch System)
派遣系統負責資源獲取與角色數值損耗。

### 2.1 區域數據：`DispatchZoneData`
| 字段 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `zoneName` | `string` | 區域名稱 | 「霓虹廢料場」 |
| `pathLength` | `int` | 派遣路徑的節點總數 | 5 ~ 10 |
| `nodePool` | `List<NodeData>` | 該區域可能出現的節點池 | ~20 個節點 |
| `fixedBossNode` | `NodeData` | 強制出現在路徑末端的 Boss 節點 | `node_boss_scrap_king` |
| `requiredReceiverLevel`| `int` | 解鎖該區域所需的接收器等級 | 1 ~ 5 |
| `description` | `string` | 區域描述文字 | 「測試ZoneA」 |
| `previewImage` | `Sprite` | 區域預覽圖（可為空） | - |
| `dangerLabel` | `string` | 危險等級標籤 | `Low Risk` |

### 2.2 節點數據：`DispatchNodeData`
| 字段 | 類型 | 說明 | 數值建議/範例 |
| :--- | :--- | :--- | :--- |
| `id` / `nodeName` | `string` | 節點唯一 ID 與名稱 | `node_loot_01` / 「廢棄伺服器」 |
| `description` | `string` | 節點描述文字 | 「測試節點A-1」 |
| `type` | `NodeType` | `Combat`(0), `Loot`(1), `Story`(2), `Hazard`(3) | - |
| `difficultySTR` | `int` | 力量門檻 (影響 TU 消耗) | 5 ~ 50 |
| `difficultyAGI` | `int` | 敏捷門檻 (影響 TU 消耗) | 5 ~ 50 |
| `baseStaminaCost` | `int` | 基礎體力損耗 | 5 ~ 15 |
| `baseDamage` | `int` | 基礎生命損耗 (HP) | 10 ~ 30 |
| `canCauseDamage` | `bool` | 是否可能造成傷害 | `true` / `false` |
| `damageVariance` | `int` | 傷害隨機變異範圍 | 0 ~ 5 |
| `spawnWeight` | `int` | 出現權重 (值越高越容易出現) | 普通: 100, 稀有: 10 |
| `allowDuplicate` | `bool` | 是否允許重複出現於同一路徑 | `true` / `false` |
| `possibleLoots` | `List<LootData>` | 可能掉落的物資清單 | 詳見 2.3 |
| `logCritical` | `string` | 嚴重失敗時的日誌文字 | - |
| `logBad` | `string` | 失敗時的日誌文字 | - |
| `logNormal` | `string` | 普通成功時的日誌文字 | - |
| `logPerfect` | `string` | 完美成功時的日誌文字 | - |

### 2.3 掉落數據：`LootData`
| 字段 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `itemID` | `string` | 對應物資數據庫 ID | `item_circuit_board` |
| `dropRate` | `float` | 掉落概率 (0.0 $\sim$ 1.0) | $0.1 \sim 0.5$ |
| `minQuantity` | `int` | 最少數量 | $1$ |
| `maxQuantity` | `int` | 最大數量 | $3$ |

---

## 3. 環境與資訊系統 (Environment System)

### 3.1 每日修正數據：`DailyModifierData` (天氣/狀態)
| 字段 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | 修正項 ID | `weather_lucky_glitch` |
| `title` | `string` | 新聞顯示的標題 | 「⚠️ 數據風暴警報」 |
| `description` | `string` | 修正項詳細描述 | - |
| `icon` | `Sprite` | 顯示圖示（可為空） | - |
| `themeColor` | `Color` | 主題顏色 (RGBA) | `{r:1, g:0.84, b:0, a:0.22}` |
| `effectType` | `ModifierEffectType` | `None`(0), `LootRateUp`(1), `DamageUp`(2), `CostIncrease`(3), `LootGlitch`(4) 等 | `LootGlitch` |
| `effectValue` | `float` | 修正數值 (如 0.2 表示 +20%) | 0.2 |
| `weight` | `int` | 隨機出現權重 | 50 |

### 3.2 新聞項目數據：`NewsItemData`
| 字段 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | 新聞唯一 ID | `news_day1_welcome` |
| `type` | `NewsType` | `System`(0), `Quest`(1), `Corp`(2) | - |
| `headline` | `string` | 新聞標題 | 「幻光科技股價大跌」 |
| `content` | `string` | 新聞內容正文 | - |
| `image` | `Sprite` | 新聞配圖（可為空） | - |
| `priority` | `int` | 顯示優先級 (高優先級優先出現) | 10 |
| `minDay` | `int` | 出現的最早天數 | 1 |
| `isOneTime` | `bool` | 是否僅出現一次 | `true` |
| `requiredVarName` | `string` | 觸發所需的變量名 (Naninovel 變量) | `b_hacker_dead` |
| `requiredVarValue` | `string` | 變量需滿足的值 | `true` |
| `conditionMode` | `ConditionMode` | `Equal`(0), `Greater`(1), `Less`(2), `NotEqual`(3) | `Equal` |
| `conditionExpression` | `string` | 進階條件表達式（可為空） | - |

---

## 3.3 道具數據 (`ItemData`)
道具系統定義遊戲中的消耗品、工具、關鍵道具等。

### 3.3.1 道具數據：`ItemData`
| 字段 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | 道具唯一 ID | `Key_001` |
| `itemName` | `string` | 道具顯示名稱 | 「損壞的硬碟」 |
| `description` | `string` | 道具描述文字 | - |
| `icon` | `Sprite` | 道具圖示 | - |
| `price` | `int` | 商店售價（0 為不可販售） | 200 |
| `type` | `ItemType` | `Tool`(0), `Consumable`(1), `Material`(2), `KeyItem`(3) | - |
| `effectType` | `ItemEffectType` | `None`(0), `Heal`(1), `Buff`(2), `Debuff`(3), `StaminaReduce`(4) 等 | - |
| `effectValue` | `float` | 效果數值 | -2 |
| `targetStringData` | `string` | 目標指定字串（可為空） | - |
| `category` | `ItemCategory` | `General`(0), `Quest`(1), `Valuable`(2), `Rare`(3), `Unique`(4) | - |
| `unlockDay` | `int` | 解鎖日期（天數） | 1 |
| `expireDay` | `int` | 過期日期（999 為不過期） | 999 |
| `isUnique` | `bool` | 是否為唯一道具（不可堆疊） | `false` |

---

## 4. 角色數據 (Character System)
角色數值直接影響派遣的成敗與故事走向。

### 4.1 角色屬性規格 (`LycaonData` / `XavierData`)
| 屬性 | 類型 | 範圍/單位 | 說明 |
| :--- | :--- | :--- | :--- |
| `Health` / `MaxHealth` | `int` | $0 \sim 100$ | 生命值，歸零則派遣失敗 |
| `Stamina` / `MaxStamina` | `int` | $0 \sim 100$ | 體力值，影響行動能力 |
| `Strength` (力量) | `int` | $10 \sim 100$ | 影響戰鬥節點的 TU 消耗 |
| `Agility` (敏捷) | `int` | $10 \sim 100$ | 影響危險節點的生存率 |
| `Loyalty` (忠誠度) | `int` | $0 \sim 100$ | 影響派遣意願與特定對話 |
| `Love` (好感度) | `int` | $0 \sim 100$ | 決定結局分歧的關鍵數值 |
| `SyncRate` (同步率) | `int` | $0 \sim 100$ | 影響高級設備的加成效果 |
| `status` | `TeamStatus` | `InTeam`, `Dispatch`, `Leave` | 角色當前狀態 |

---

## 5. 數值設計指南 (Numerical Guide)

### 5.1 派遣 TU 計算邏輯 (參考)
$\text{TUCost} = \text{BaseTUCost} + \frac{(\text{NodeDifficulty} - \text{CharStat})}{\text{ScalingFactor}}$
*(註：數值企劃在設計 `difficultySTR` 時應對照角色基礎屬性，確保普通節點消耗 $1 \sim 2$ TU，困難節點消耗 $3 \sim 5$ TU)*

### 5.2 經濟平衡建議 (參考)
- **低端訂單**：獎勵 500 ~ 1000，消耗體力 10 ~ 20。
- **高端訂單**：獎勵 3000 ~ 8000，消耗體力 30 ~ 50。
- **物資價格**：消耗品價格 ≈ 1-2 個低端訂單收益；高級設備 ≈ 5-10 個高端訂單收益。