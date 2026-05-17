// data.js — CORS 遊戲資料（從 Unity YAML 資產解析而來）
// 這個檔案是網站的單一資料真相來源 (SSOT)
// 編輯內容後可透過 GitHub API 推送回饋到 repo

const GameData = (function() {
  const orders = [{"_file":"Day1_01.asset","_type":"CyberOccult.Data.OrderData","orderID":"D1_01","clientName":"機械和尚","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Day1_02.asset","_type":"CyberOccult.Data.OrderData","orderID":"D1_02","clientName":"機械和尚未完成","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Day1_03.asset","_type":"CyberOccult.Data.OrderData","orderID":"D1_03","clientName":"機械和尚未完成","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Order_001.asset","_type":"CyberOccult.Data.OrderData","orderID":"Rand_001","clientName":"被遺棄的義眼","rewardAmount":"1200","durationHours":"2","staminaCost":"10","pathWidth":"0.5","isPathMoving":"0","timeLimit":"120"},{"_file":"Order_002.asset","_type":"CyberOccult.Data.OrderData","orderID":"Rand_002","clientName":"損壞的神經晶片","rewardAmount":"500","durationHours":"1","staminaCost":"8","pathWidth":"0.5","isPathMoving":"0","timeLimit":"60"},{"_file":"Order_003.asset","_type":"CyberOccult.Data.OrderData","orderID":"Rand_003","clientName":"神經晶片殘骸","rewardAmount":"800","durationHours":"2","staminaCost":"12","pathWidth":"0.5","isPathMoving":"0","timeLimit":"90"},{"_file":"Tier1_001.asset","_type":"CyberOccult.Data.OrderData","orderID":"T1_001","clientName":"測試訂單T1_001","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Tier1_002.asset","_type":"CyberOccult.Data.OrderData","orderID":"T1_002","clientName":"測試訂單T1_002","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Tier1_003.asset","_type":"CyberOccult.Data.OrderData","orderID":"T1_003","clientName":"測試訂單T1_003","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Tier1_005.asset","_type":"CyberOccult.Data.OrderData","orderID":"T1_005","clientName":"測試訂單T1_005","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"Tier1_006.asset","_type":"CyberOccult.Data.OrderData","orderID":"T1_006","clientName":"測試訂單T1_006","rewardAmount":"20","durationHours":"2","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"30"},{"_file":"TOrder_001.asset","_type":"CyberOccult.Data.OrderData","orderID":"Test_001","clientName":"測試用訂單","rewardAmount":"0","durationHours":"0","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"0"},{"_file":"TOrder_002.asset","_type":"CyberOccult.Data.OrderData","orderID":"Test_002","clientName":"測試用訂單","rewardAmount":"0","durationHours":"0","staminaCost":"0","pathWidth":"0.5","isPathMoving":"0","timeLimit":"0"}];

  const events = [{"_file":"Day1.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day1","startDay":"1","endDay":"1","startHour":"9","endHour":"24","locationId":"Office","type":"1","targetId":"Story/Day1","oneTimeOnly":"0"},{"_file":"Day2_1.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day2_1","startDay":"2","endDay":"2","startHour":"9","endHour":"12","locationId":"Office","type":"1","targetId":"Story/Day2_1","oneTimeOnly":"0"},{"_file":"Day2_2.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day2_2","startDay":"2","endDay":"2","startHour":"14","endHour":"18","locationId":"Office","type":"1","targetId":"Story/Day2_2","oneTimeOnly":"0"},{"_file":"Day2_3.asset","_type":"CyberOccult.Data.TimeEventData","id":"Day2_3","startDay":"2","endDay":"2","startHour":"19","endHour":"24","locationId":"Office","type":"1","targetId":"Story/Day2_3","oneTimeOnly":"0"},{"_file":"TestEvent_001.asset","_type":"CyberOccult.Data.TimeEventData","id":"TestEvent_001","startDay":"1","endDay":"1","startHour":"9","endHour":"24","locationId":"Office","type":"1","targetId":"Story/Day1","oneTimeOnly":"0"},{"_file":"TestEvent_002.asset","_type":"CyberOccult.Data.TimeEventData","id":"TestEvent_002","startDay":"1","endDay":"1","startHour":"9","endHour":"24","locationId":"Office","type":"1","targetId":"Story/Day1","oneTimeOnly":"0"}];

  const items = [{"_file":"Key_001.asset","_type":"CyberOccult.Data.ItemData","id":"Key_001","itemName":"損壞的硬碟","description":"測試道具.萊卡翁在虛擬廢墟A區找到的硬碟","price":"0","type":"3","effectType":"0","effectValue":"0","unlockDay":"1","expireDay":"999","isUnique":"0"},{"_file":"Tool_001.asset","_type":"CyberOccult.Data.ItemData","id":"Tool_001","itemName":"工具001","description":"測試工具","price":"200","type":"0","effectType":"0","effectValue":"0","unlockDay":"1","expireDay":"999","isUnique":"0"},{"_file":"Tool_005.asset","_type":"CyberOccult.Data.ItemData","id":"Tool_005","itemName":"工具005","description":"測試工具005","price":"500","type":"0","effectType":"0","effectValue":"0","unlockDay":"1","expireDay":"999","isUnique":"0"}];

  const emails = [{"_file":"Mail_001.asset","_type":"CyberOccult.Data.EmailData","id":"Mail_001","sender":"寄件人","subject":"緊急委託","content":"測試Mail"},{"_file":"Mail_002.asset","_type":"CyberOccult.Data.EmailData","id":"Mail_002","sender":"寄件人","subject":"標題002","content":"內容002"},{"_file":"Tier1_001.asset","_type":"CyberOccult.Data.EmailData","id":"T1Mail_001","sender":"寄件人","subject":"主題001","content":"內容001"},{"_file":"Tier1_002.asset","_type":"CyberOccult.Data.EmailData","id":"T1Mail_002","sender":"寄件人","subject":"主題002","content":"內容002"},{"_file":"Tier1_003.asset","_type":"CyberOccult.Data.EmailData","id":"T1Mail_003","sender":"寄件人","subject":"主題003","content":"內容003"},{"_file":"Tier1_005.asset","_type":"CyberOccult.Data.EmailData","id":"T1Mail_005","sender":"寄件人","subject":"主題005","content":"內容005"},{"_file":"Tier1_006.asset","_type":"CyberOccult.Data.EmailData","id":"T1Mail_006","sender":"寄件人","subject":"主題006","content":"內容006"}];

  const news = [{"_file":"Clear.asset","_type":"CyberOccult.Data.NewsItemData","id":"weather_clear","type":"0","headline":"天氣晴朗","content":"今日天氣良好，派遣效率正常。","priority":"5","minDay":"1"},{"_file":"Glitch.asset","_type":"CyberOccult.Data.NewsItemData","id":"weather_glitch","type":"0","headline":"數據風暴警報","content":"城市網絡出現異常波動，派遣成功率 -20%。","priority":"8","minDay":"3"},{"_file":"Storm.asset","_type":"CyberOccult.Data.NewsItemData","id":"weather_storm","type":"0","headline":"設施警戒","content":"風暴來襲，該區域派遣額外消耗 1 TU。","priority":"9","minDay":"5"},{"_file":"Corp_01.asset","_type":"CyberOccult.Data.NewsItemData","id":"corp_01","type":"2","headline":"幻光科技股價大跌","content":"總部位於上城的幻光科技有限公司今日股價驟降 23%，引發市場恐慌。","priority":"7","minDay":"1"},{"_file":"Quest_Result.asset","_type":"CyberOccult.Data.NewsItemData","id":"quest_result_01","type":"1","headline":"委託完成報告","content":"你的小隊成功從廢料場回收了受損的軍事晶片。","priority":"6","minDay":"1"}];

  const meta = {
    "title": "靈樞堂 Cyber-Occult Repair Shop",
    "tagline_zh": "被詛咒的電子產品維修專家",
    "tagline_en": "Fixing the Cursed. Unlocking the Truth.",
    "repo": "straydog3301/cors_side",
    "game_repo": "straydog3301/cors",
    "badges": ["維修模擬","派遣系統","戀愛冒險","賽博龐克"],
    "phases": [
      {"name":"Phase 1: 核心框架","status":"done","desc":"Unity 專案設定、Naninovel 整合基礎維修/派遣系統","progress":100},
      {"name":"Phase 2: 系統深化","status":"active","desc":"經濟循環、新聞系統、角色屬性系統聯動","progress":40},
      {"name":"Phase 3: 內容產出","status":"pending","desc":"劇本撰寫、30+ 維修關卡、派遣區域與節點池","progress":15},
      {"name":"Phase 4: 拋光平衡","status":"pending","desc":"UI 優化、數值平衡、完整測試","progress":0}
    ],
    "stats": {"遊戲天數":"28","戀愛路線":"2","維修關卡目標":"30+","派遣區域":"3-5","開發預期":"6-10個月"},
    "world_timeline": [
      {"year":"2088","title":"霓虹之城","desc":"巨型企業掌控一切資訊，底層人民靠修補淘汰科技勉強維生。數據是新的黃金，詛咒是常見的副作用。"},
      {"year":"2088","title":"靈樞堂","desc":"城市中最奇怪的資訊節點——那些「壞掉」的設備往往藏著不該被看見的記憶與秘密。"},
      {"year":"2088","title":"地下區第十三段","desc":"企業管線交界處，三教九流匯集之地。這裡有最便宜的零件，也有最危險的任務。"},
      {"year":"2088","title":"28天循環","desc":"每一天的選擇都會影響結局。維修、派遣、對話——每一個動作都在為結局做鋪墊。"}
    ],
    "characters": [
      {"id":"xavier","name_zh":"澤維爾","name_en":"Xavier","route":"XAVIER_ROUTE","role":"異端審判官 · 秩序與秘密的守護者","description":"白袍金絲眼鏡，手持精密掃描儀器的審判官。來自光環科技下屬的異端審裁處，專門處理「數據層面的神異事件」。冷靜、克制、每一句話都是陷阱——但他在靈樞堂前停留的時間，似乎比必要的更長。","tags":["審判官","教會線","冷靜"]},
      {"id":"lycaon","name_zh":"萊卡翁","name_en":"Lycaon","route":"LYCAON_ROUTE","role":"改造逃亡者 · 渴望真相的野獸","description":"銀髮異色瞳，左臂為改造機械義肢。曾在企業實驗室中度過不為人知的歲月，逃出後成為地下區最危險也最值得信任的夥伴。脾氣火爆，忠誠度卻是MAX——只要他認定了你。","tags":["改造人","地下線","火爆"]}
    ],
    "systems": [
      {"id":"orders","num":"01","icon":"🔧","name":"維修訂單系統","desc":"顧客將「損壞的電子產品」送到靈樞堂——有時它們只是需要重新焊接，有時它們承載著不屬於這個世界的數據詛咒。玩家操控維修探針，沿著故障路徑前進，避開障礙物，在時限內完成維修。","tags":["路徑維修小遊戲","限時挑戰","動態障礙"]},
      {"id":"dispatch","num":"02","icon":"📡","name":"派遣系統","desc":"利用「接收器」與外派角色保持連結。選擇區域、安排路線、配置角色——然後看著他們一個節點一個節點地前進。戰鬥、搜索物資、面對隨機事件，每一次派遣的結果都不會相同。","tags":["Roguelike節點","屬性判定","物資掉落"]},
      {"id":"shop","num":"03","icon":"🏪","name":"商店與經濟系統","desc":"維修收入 → 購買物資 → 派遣強化 → 承接更高階訂單。物資分為工具、消耗品、素材與關鍵道具。","tags":["經濟循環","物資管理","稀有道具"]},
      {"id":"news","num":"04","icon":"📰","name":"每日新聞系統","desc":"每天早晨，你會收到一份地下區的新聞簡報。天氣與城市狀態會影響當天的派遣效率。","tags":["每日修正","天氣系統","事件觸發"]},
      {"id":"naninovel","num":"05","icon":"💬","name":"Naninovel 對話系統","desc":"全語音戀愛冒險部分採用 Naninovel 引擎驅動。豐富的對話選項、角色表情差分、路線分歧與多結局結構。","tags":["視覺小說","路線分歧","好感度"]},
      {"id":"character","num":"06","icon":"📊","name":"角色屬性系統","desc":"每個角色都有力量、敏捷、體力、忠誠度與好感度等屬性。派遣消耗體力與生命，好感度影響對話選項與結局觸發。","tags":["角色成長","屬性驅動","多結局"]}
    ]
  };

  const notes = [
    {"id":"n1","title":"開發原則","content":"MVP 優先 → 垂直切片 → 內容填充。拒絕完美主義，先讓功能動起來再讓它好看。","tags":["原則"],"updated":"2024-01-15"},
    {"id":"n2","title":"維修系統 faultPoints 格式","content":"faultPoints 是 Vector2[]，儲存相對於維修區域原點的座標。路徑為封閉曲線，請用絕對座標。","tags":["技術","維修"],"updated":"2024-02-20"},
    {"id":"n3","title":"派遣系統 TU 計算公式","content":"TUCost = BaseTUCost + (NodeDifficulty - CharStat) / ScalingFactor。設計 difficultySTR 時請對照角色基礎屬性，確保普通節點消耗 1~2 TU，困難節點消耗 3~5 TU。","tags":["數值","派遣"],"updated":"2024-03-01"}
  ];

  let _overrides = {};
  return {
    get orders() { return _overrides.orders || orders; },
    get events() { return _overrides.events || events; },
    get items()  { return _overrides.items || items; },
    get emails() { return _overrides.emails || emails; },
    get news()   { return _overrides.news || news; },
    get meta()   { return _overrides.meta || meta; },
    get notes()  { return _overrides.notes || notes; },
    set orders(v) { _overrides.orders = v; },
    set events(v) { _overrides.events = v; },
    set items(v)  { _overrides.items = v; },
    set emails(v) { _overrides.emails = v; },
    set news(v)   { _overrides.news = v; },
    set meta(v)   { _overrides.meta = v; },
    set notes(v)  { _overrides.notes = v; },
    reset() { _overrides = {}; },
    exportAll() {
      return {orders:this.orders, events:this.events, items:this.items, emails:this.emails, news:this.news, meta:this.meta, notes:this.notes};
    }
  };
})();