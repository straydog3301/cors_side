// data.js — CORS Game Data (auto-generated, UTF-8 clean)
// Last updated: 2026-05-18T11:47:10.000Z

const GameData = (function() {
  const orders = [{"_file":"Day1_01.asset","_type":"CyberOccult.Data.OrderData","orderID":"D1_01","clientName":"機械和尚","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Order_001.asset","_type":"CyberOccult.Data.OrderData","orderID":"Rand_001","clientName":"被遺棄的義眼","rewardAmount":"1200","durationHours":"2","staminaCost":"10","pathWidth":"0.5","isPathMoving":"0","timeLimit":"120"},{"_file":"Order_002.asset","_type":"CyberOccult.Data.OrderData","orderID":"Rand_002","clientName":"損壞的神經晶片","rewardAmount":"500","durationHours":"1","staminaCost":"8","pathWidth":"0.5","isPathMoving":"0","timeLimit":"60"},{"_file":"Order_003.asset","_type":"CyberOccult.Data.OrderData","orderID":"Rand_003","clientName":"神經晶片殘骸","rewardAmount":"800","durationHours":"2","staminaCost":"12","pathWidth":"0.5","isPathMoving":"0","timeLimit":"90"}];
  const events = [{"_file":"Day1.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day1","startDay":"1","endDay":"1","startHour":"9","endHour":"24","locationId":"Office","type":"1","targetId":"Story/Day1","oneTimeOnly":"1"},{"_file":"Day2_1.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day2_1","startDay":"2","endDay":"2","startHour":"9","endHour":"12","locationId":"Office","type":"1","targetId":"Story/Day2_1","oneTimeOnly":"1"},{"_file":"Day2_2.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day2_2","startDay":"2","endDay":"2","startHour":"14","endHour":"18","locationId":"Office","type":"1","targetId":"Story/Day2_2","oneTimeOnly":"1"},{"_file":"Day2_3.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day2_3","startDay":"2","endDay":"2","startHour":"19","endHour":"24","locationId":"Office","type":"1","targetId":"Story/Day2_3","oneTimeOnly":"1"}];
  const items = [{"_file":"Key_001.asset","_type":"CyberOccult.Data.ItemData","id":"Key_001","itemName":"損壞的硬碟","description":"萊卡翁在虛擬廢墟A區找到的損壞硬碟，可能藏有企業機密數據。","price":"0","type":"3","effectType":"0","effectValue":"0","unlockDay":"1","expireDay":"999","isUnique":"1"},{"_file":"Tool_001.asset","_type":"CyberOccult.Data.ItemData","id":"Tool_001","itemName":"基礎焊接工具","description":"標準維修用焊接筆，適用於大部分電路板維修。","price":"200","type":"0","effectType":"0","effectValue":"0","unlockDay":"1","expireDay":"999","isUnique":"0"},{"_file":"Tool_005.asset","_type":"CyberOccult.Data.ItemData","id":"Tool_005","itemName":"奈米探針套件","description":"高精度維修工具，可處理微米級電路故障。","price":"500","type":"0","effectType":"0","effectValue":"0","unlockDay":"3","expireDay":"999","isUnique":"0"},{"_file":"Consumable_001.asset","_type":"CyberOccult.Data.ItemData","id":"c_001","itemName":"冷卻凝膠","description":"一次性散熱凝膠，維修時降低元件過熱風險。","price":"80","type":"1","effectType":"1","effectValue":"15","unlockDay":"1","expireDay":"999","isUnique":"0"},{"_file":"Material_001.asset","_type":"CyberOccult.Data.ItemData","id":"m_001","itemName":"回收電路板","description":"從廢料場回收的通用電路板，可用於維修或改造。","price":"40","type":"2","effectType":"0","effectValue":"0","unlockDay":"1","expireDay":"999","isUnique":"0"}];
  const emails = [{"_file":"Mail_001.asset","_type":"CyberOccult.Data.EmailData","id":"Mail_001","sender":"地下區物流中心","subject":"零件配送通知","content":"您訂購的維修零件將於今日送達靈樞堂，請注意查收。"},{"_file":"Mail_002.asset","_type":"CyberOccult.Data.EmailData","id":"Mail_002","sender":"匿名委託人","subject":"加密委託 — 閱後即焚","content":"我有一個特殊設備需要修理，報酬從優。明日下午三時，老地方見。"}];
  const news = [{"_file":"Clear.asset","_type":"CyberOccult.Data.NewsItemData","id":"weather_clear","type":"0","headline":"天氣晴朗","content":"今日天氣良好，派遣效率正常。","priority":"5","minDay":"1"},{"_file":"Glitch.asset","_type":"CyberOccult.Data.NewsItemData","id":"weather_glitch","type":"0","headline":"數據風暴警報","content":"城市網路出現異常波動，派遣成功率 -20%。","priority":"8","minDay":"3"},{"_file":"Storm.asset","_type":"CyberOccult.Data.NewsItemData","id":"weather_storm","type":"0","headline":"設施警戒","content":"風暴來襲，該區域派遣額外消耗 1 TU。","priority":"9","minDay":"5"},{"_file":"Corp_01.asset","_type":"CyberOccult.Data.NewsItemData","id":"corp_01","type":"2","headline":"幻光科技股價大跌","content":"總部位於上城的幻光科技有限公司今日股價急降 23%，引發市場恐慌。","priority":"7","minDay":"1"},{"_file":"Quest_Result.asset","_type":"CyberOccult.Data.NewsItemData","id":"quest_result_01","type":"1","headline":"委託完成報告","content":"你的小隊成功從廢料場回收了受損的軍事晶片。","priority":"6","minDay":"1"}];
  const notes = [{"id":"n1","title":"開發原則","content":"MVP優先 → 垂直切片 → 內容填充。拒絕完美主義，先讓功能動起來再讓它好看。","tags":["原則"],"updated":"2026-05-17"},{"id":"n2","title":"維修系統 faultPoints 格式","content":"faultPoints 是 Vector2[]，儲存相對於維修區域原點的座標。路徑為封閉曲線，請用絕對座標。","tags":["技術","維修"],"updated":"2026-05-17"},{"id":"n3","title":"派遣系統 TU 計算公式","content":"TUCost = BaseTUCost + (NodeDifficulty - CharStat) / ScalingFactor。設計 difficultySTR 時對照角色基礎屬性，確保普通節點消耗 1~2 TU，困難節點消耗 3~5 TU。","tags":["數值","派遣"],"updated":"2026-05-17"},{"id":"n4","title":"角色關係張力：Lycaon vs Xavier","content":"Lycaon（馴服）與 Xavier（墮落/共犯）構成核心關係對比。Lycaon 線考驗玩家馴服危險存在的能力，Xavier 線則探索自願墮入罪惡的共同體關係。兩條線在敘事調性、選擇導向和結局條件上截然不同。","tags":["角色","敘事","關係設計"],"updated":"2026-05-18"},{"id":"n5","title":"經濟模型：道具分類系統","content":"3類永久升級道具（工具升級、店面擴建、技能解鎖）+ 消耗性道具（維修耗材、派遣補給、好感贈禮）+ 關鍵道具與許可證（黑市通行證、特殊零件、情報檔案）。形成消耗→獲利→再投資的閉環。","tags":["數值","經濟","系統設計"],"updated":"2026-05-18"},{"id":"n6","title":"OS 系統設計：5個圖標按鈕","content":"玩家介面以 OS 系統形式呈現，包含5個核心圖標按鈕：信件（劇情觸發/角色聯絡）、購物（道具商店）、帳簿（財務/庫存管理）、地圖（派遣/探索節點）、新聞（世界觀資訊/事件預告）。","tags":["UI/UX","系統設計"],"updated":"2026-05-18"},{"id":"n7","title":"鐵三角循環體系","content":"每日循環流程（接單→維修→派遣→經營）→ 漸進式消耗系統（工具耐久度、角色體力、資源儲備每日遞減）→ 忠誠度摩擦力（好感度自然衰減機制，推動玩家持續互動）。三層結構驅動核心玩法 loop。","tags":["系統設計","遊戲循環","數值"],"updated":"2026-05-18"},{"id":"n8","title":"好感四階段系統","content":"每角色設4個好感階段：陌生（解鎖基礎委託）→ 熟悉（解鎖個人事件）→ 信賴（解鎖背景故事）→ 羈絆（解鎖專屬結局）。每階段包含不同心態描述與專屬互動事件，階段轉換需達成指定條件。","tags":["角色","敘事","系統設計"],"updated":"2026-05-18"},{"id":"n9","title":"結局分支設計：7條結局","content":"每角色3條結局（HE 好結局/BE 壞結局/NE 普通結局），Lycaon 與 Xavier 各3條，第7條為共通壞結局（破產/死亡）或隱藏結局。結局品質取決於好感度、關鍵選擇與資源管理綜合判定。","tags":["敘事","分支","結局"],"updated":"2026-05-18"},{"id":"n10","title":"Day 21/24 關鍵分歧節點","content":"Day 21 為隊友選擇分歧點：玩家決定最終信賴哪位角色，鎖定對應路線。Day 24 為結局鎖定分歧點：根據前期選擇與資源狀態，鎖定 HE/BE/NE 判定條件。兩天之間為最後衝刺期，考驗玩家資源分配策略。","tags":["敘事","分支","節奏設計"],"updated":"2026-05-18"}];
  const meta = {
  "title": "靈樞堂 Cyber-Occult Repair Shop",
  "tagline_zh": "被詛咒的電子產品維修專家",
  "tagline_en": "Fixing the Cursed. Unlocking the Truth.",
  "repo": "straydog3301/cors_side",
  "game_repo": "straydog3301/cors",
  "badges": [
    "維修模擬",
    "派遣系統",
    "戀愛冒險",
    "賽博龐克"
  ],
  "phases": [
    {
      "name": "Phase 1: 核心框架",
      "status": "done",
      "desc": "Unity 專案設定、Naninovel 整合基礎維修/派遣系統",
      "progress": 100
    },
    {
      "name": "Phase 2: 系統深化",
      "status": "active",
      "desc": "經濟循環、新聞系統、角色屬性系統聯動",
      "progress": 40
    },
    {
      "name": "Phase 3: 內容產出",
      "status": "pending",
      "desc": "劇本撰寫、30+ 維修關卡、派遣區域與節點池",
      "progress": 15
    },
    {
      "name": "Phase 4: 打磨平衡",
      "status": "pending",
      "desc": "UI 優化、數值平衡、完整測試",
      "progress": 0
    }
  ],
  "stats": {
    "遊戲天數": "28",
    "戀愛路線": "2",
    "好感階段": "4",
    "維修關卡目標": "30+",
    "派遣區域": "3-5",
    "結局數量": "7",
    "每條路線結局": "3（HE / BE / NE）",
    "開發預期": "6-10個月"
  },
  "world_timeline": [
    {
      "year": "2088",
      "title": "靈樞堂",
      "desc": "城市中最奇怪的資訊節點——那些「壞掉」的設備往往藏著不該被看見的記憶與秘密。MC 經營的維修行，表面維修電子產品，實則處理深埋於數據層面的詛咒與真相。",
      "progress": 95,
      "branch": "common"
    },
    {
      "year": "2088",
      "title": "地下區第十三段",
      "desc": "企業管線交界處，三教九流匯集之地。這裡有最便宜的零件，也有最危險的任務。Lycaon 的活動範圍，充斥黑市交易、改造戰士與禁忌技術。",
      "progress": 80,
      "branch": "common"
    },
    {
      "year": "2088",
      "title": "28天循環",
      "desc": "每一天的選擇都會影響結局。維修、派遣、對話——每一個動作都在為結局做鋪墊。Day 1–21 共通，Day 21–24 分歧，Day 24–28 角色專屬路線。",
      "progress": 60,
      "branch": "common"
    },
    {
      "year": "2088",
      "title": "教會與企業",
      "desc": "Xavier 所屬的異端裁審處，表面隸屬光環科技，暗中監管數據層面的「神異事件」。教會與企業之間的利益糾葛貫穿整個世界觀。",
      "progress": 40,
      "branch": "common"
    },
    {
      "year": "2088",
      "title": "第九生化區",
      "desc": "企業最高機密實驗區，Lycaon 的逃出地。狂暴病毒的研發源頭、改造戰士的誕生之地，隱藏著世界真相的核心秘密。",
      "progress": 30,
      "branch": "common"
    }
  ],
  "story_timeline": [
    {
      "days": "Day 1 – 21",
      "name": "共通路線：相遇與試探",
      "tag": "common",
      "desc": "MC 接手靈樞堂，建立店鋪基礎，處理日常維修訂單。Lycaon 因狂暴病毒失控闖入，Xavier 以調查名義造訪。雙角色登場，玩家初步了解世界觀與兩人的性格差異。",
      "progress": 80
    },
    {
      "days": "Day 21 – 24",
      "name": "分歧路線：情感的界線",
      "tag": "common",
      "desc": "根據玩家在共通路線的選擇與好感度累積，劇情開始傾向往 Lycaon 或 Xavier 方向發展。角色互動加深，隱藏過去逐漸浮現。",
      "progress": 30
    },
    {
      "days": "Day 24 – 28",
      "name": "澤維爾路線：秩序與真相",
      "tag": "xavier",
      "desc": "Xavier 的色慾病毒全面爆發，神經梳理成為唯一穩定手段。高傲的審判官在生理崩潰與情感成癮之間掙扎。MC 需在信任、控制與真相之間做出選擇，通往三種結局。",
      "progress": 25
    },
    {
      "days": "Day 24 – 28",
      "name": "萊卡翁路線：野性與救贖",
      "tag": "lycaon",
      "desc": "Lycaon 的狂暴病毒進入危險期，只有 MC 能進行維修（撫摸）來穩定。從強制與敵意逐漸轉向依賴與獻身。MC 的態度決定他最終的歸宿——項圈之下是忠誠還是死亡。",
      "progress": 20
    }
  ],
  "endings": [
    {
      "id": "ending_01",
      "name": "銀色的項圈",
      "route": "lycaon",
      "desc": "Lycaon True End。MC 接納了 Lycaon 的全部——狂暴的獸性與破碎的人性。銀色抑制項圈成為羈絆的證明而非枷鎖。他學會用理性擁抱忠誠，兩人成為彼此唯一的錨點。",
      "char": "lycaon",
      "progress": 5
    },
    {
      "id": "ending_02",
      "name": "染血的項圈",
      "route": "lycaon",
      "desc": "Lycaon Bad End。MC 的疏離與拒絕讓 Lycaon 體內狂暴病毒徹底失控。他化身復仇的野獸衝回企業總部引爆自己，MC 只能在廢墟中撿起他殘留的染血機械左手。",
      "char": "lycaon",
      "progress": 0
    },
    {
      "id": "ending_03",
      "name": "空白的誓言",
      "route": "lycaon",
      "desc": "Lycaon Normal End。雙方維持著若即若離的合作關係。Lycaon 的記憶始終殘缺，抑制項圈從未摘下。他依舊守護在靈樞堂周圍——但那份未說出口的誓言始終懸在空中。",
      "char": "lycaon",
      "progress": 0
    },
    {
      "id": "ending_04",
      "name": "剝落的聖徒與契約之夜",
      "route": "xavier",
      "desc": "Xavier True End。Xavier 在 MC 面前徹底卸下審判官的面具，承認對 MC 的依賴與成癮。契約之夜，他親手折斷教會的枷鎖，選擇以「人」而非「聖徒」的身份與 MC 並肩而立。",
      "char": "xavier",
      "progress": 10
    },
    {
      "id": "ending_05",
      "name": "零度的距離",
      "route": "xavier",
      "desc": "Xavier Bad End。MC 無法接受 Xavier 的高壓控制與情感勒索，關係徹底破裂。Xavier 回歸教會恢復絕對零度的審判官身份，靈樞堂被封，兩人成為最熟悉的陌生人。",
      "char": "xavier",
      "progress": 0
    },
    {
      "id": "ending_06",
      "name": "破碎的王冠",
      "route": "xavier",
      "desc": "Xavier Normal End。Xavier 的色慾病毒得到控制，但兩人之間的距離從未真正消融。他回到教會高層，繼續執行審判官的職責——偶爾會站在靈樞堂門外，遠遠地看一眼，然後轉身離開。",
      "char": "xavier",
      "progress": 0
    },
    {
      "id": "ending_07",
      "name": "虛擬桃源",
      "route": "secret",
      "desc": "秘密結局。發現所有世界——靈樞堂、地下區、教會、企業——都是虛擬實境模擬。選擇留在虛擬世界，與所有人一起活在夢中；或者選擇醒來，面對一片荒蕪的真實。",
      "char": "any",
      "progress": 0
    }
  ],
  "characters": [
    {
      "id": "xavier",
      "name_zh": "澤維爾",
      "name_en": "Xavier",
      "route": "XAVIER_ROUTE",
      "role": "高嶺之花 · 傲慢菁英 · 強氣攻 (Dominant Top)",
      "description": "大背頭金髮（非白髮），紫眼睛細長尖銳，金屬鏈眼鏡，潔白教會制服審判官。有潔癖，眼神極度高冷，左眼角有淚痣。感染了色慾病毒，需要 MC 進行神經梳理。表面用命令、威脅與高壓姿態掩飾生理崩潰和對 MC 的成癮。禁慾感與羞恥Play 貫穿互動——醫療設備的冷靜包裝下，是日漸失控的佔有慾。",
      "tags": [
        "審判官",
        "教會線",
        "禁慾",
        "高冷",
        "強氣攻",
        "成癮",
        "墮落共犯"
      ]
    },
    {
      "id": "lycaon",
      "name_zh": "萊卡翁",
      "name_en": "Lycaon",
      "route": "LYCAON_ROUTE",
      "role": "狂犬變忠犬 · 年下 · 強氣受 (Power Bottom)",
      "description": "銀髮異色瞳（左眼藍色，右眼紅色義眼），滿身戰損傷痕，戴著抑制項圈的改造戰士。銀色短髮雜亂，飛行外套（裡面沒穿）、軍褲軍靴，機械左手，胸口有大疤痕。體內有狂暴病毒，只有 MC 能維修（撫摸）。互動充滿物理性的粗暴與精神上的深度依賴。體格差、分離焦慮——從強制與敵意，到獻身與執著，他是被馴服的野獸，你是他唯一的錨點。",
      "tags": [
        "改造人",
        "地下線",
        "狂犬",
        "忠犬",
        "年下",
        "強氣受",
        "野性",
        "分離焦慮"
      ]
    }
  ],
  "systems": [
    {
      "id": "orders",
      "num": "01",
      "icon": "🔧",
      "name": "維修訂單系統",
      "desc": "顧客將「損壞的電子產品」送到靈樞堂——有時它們只是需要重新焊接，有時它們承載著來自數據層面的詛咒。玩家操控維修探針，沿著故障路徑前進，避開動態障礙物，在時限內完成維修。每件維修物品都藏著一段不為人知的記憶碎片。",
      "tags": [
        "路徑維修小遊戲",
        "限時挑戰",
        "動態障礙",
        "記憶碎片"
      ]
    },
    {
      "id": "dispatch",
      "num": "02",
      "icon": "📡",
      "name": "派遣系統",
      "desc": "利用「接收器」與外派角色保持連結。選擇區域（地下區第十三段、教會轄區、第九生化區等）、安排路線、配置角色——然後看著他們一個節點一個節點地前進。戰鬥判定、搜索物資、面對隨機事件，每次派遣結果不會相同。角色體力與生命值限制派遣次數。",
      "tags": [
        "Roguelike節點",
        "屬性判定",
        "物資掉落",
        "區域探索"
      ]
    },
    {
      "id": "shop",
      "num": "03",
      "icon": "🏪",
      "name": "商店與經濟系統",
      "desc": "維修收入 → 購買物資 → 派遣強化 → 承接更高階訂單 → 解鎖新區域，形成完整的經濟循環。物資分為工具（提升維修效率）、消耗品（恢復體力/生命）、素材（升級角色裝備）與關鍵道具（觸發特殊事件/結局條件）。",
      "tags": [
        "經濟循環",
        "物資管理",
        "稀有道具",
        "升級強化"
      ]
    },
    {
      "id": "news",
      "num": "04",
      "icon": "📰",
      "name": "每日新聞系統",
      "desc": "每天早晨，MC 會收到一份地下區的新聞簡報。天氣狀態（輻射霧、數據風暴等）影響派遣效率與角色心情，城市事件（企業突襲、地下區衝突等）觸發特殊派遣任務或對話選項。新聞內容部分真實、部分誤導——信息本身也是遊戲機制的一部分。",
      "tags": [
        "每日修正",
        "天氣系統",
        "事件觸發",
        "信息博弈"
      ]
    },
    {
      "id": "naninovel",
      "num": "05",
      "icon": "💬",
      "name": "Naninovel 對話系統",
      "desc": "全語音戀愛冒險部分採用 Naninovel 引擎驅動。豐富的對話選項影響好感度（四階段）、路線分歧與結局走向。角色表情差分、動態背景切換、關鍵選項的即時屬性判定——每一次對話都在塑造與 Lycaon 或 Xavier 的關係。",
      "tags": [
        "視覺小說",
        "路線分歧",
        "好感度四階段",
        "屬性判定"
      ]
    },
    {
      "id": "character",
      "num": "06",
      "icon": "📊",
      "name": "角色屬性系統",
      "desc": "每個角色擁有力量、敏捷、體力、忠誠度與好感度等屬性。派遣消耗體力與生命值，好感度（0-100%）劃分為四階段——強制敵意、試探界線、崩潰坦露、獻身執著——影響對話選項解鎖與結局觸發。Lycaon 側重力量/體質，Xavier 側重敏捷/感知。",
      "tags": [
        "角色成長",
        "屬性驅動",
        "好感四階段",
        "多結局"
      ]
    }
  ]
};

  const _overrides = {};

  return {
    get orders() { return _overrides.orders || orders; },
    get events() { return _overrides.events || events; },
    get items() { return _overrides.items || items; },
    get emails() { return _overrides.emails || emails; },
    get news() { return _overrides.news || news; },
    get notes() { return _overrides.notes || notes; },
    get meta() { return _overrides.meta || meta; },
    set orders(v) { _overrides.orders = v; },
    set events(v) { _overrides.events = v; },
    set items(v) { _overrides.items = v; },
    set emails(v) { _overrides.emails = v; },
    set news(v) { _overrides.news = v; },
    set notes(v) { _overrides.notes = v; },
    set meta(v) { _overrides.meta = v; },
    reset() { Object.keys(_overrides).forEach(k => delete _overrides[k]); },
    exportAll() { return {orders:this.orders,events:this.events,items:this.items,emails:this.emails,news:this.news,notes:this.notes,meta:this.meta,notes:this.notes}; }
  };
})();