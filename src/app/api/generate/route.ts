import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, mode, locations, daysToShop, driveTime, guestState, ageGroup, product, toneStyle, currentDate } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "請在設定中輸入您的 Gemini API Key" }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // ==== 共用知識庫 ====
    const knowledgeBase = `
【導遊專屬知識庫 (KNOWLEDGE BASE)】
請從以下四個知識庫中，根據輸入的「景點」、「客群」、「日期」、「商品」，挑選最對應的素材來組合。

一、熱門景點素材池
* 兼六園(金澤): 加賀藩養老哲學、石板育步、六勝美學
* 東茶屋街(金澤): 金箔、芸妓化妝、金箔冰淇淋
* 近江町市場(金澤): 甘海老、加賀野菜、地魚
* 長町武家屋敷(金澤): 薦掛(防雪草編)、土牆、武士精神
* 金澤車站(金澤): 鼓門(能劇)、玻璃傘(款待之心)
* 清水寺(京都): 清水舞台、音羽泉水、京漬物
* 伏見稲荷(京都): 千本鳥居、稲荷壽司
* 嵐山(京都): 竹林、湯豆腐、渡月橋
* 春日大社(奈良): 菖蒲湯、神鹿
* 淺草寺(東京): 雷門雷神、人形燒
* 築地/豐洲(東京): 本鮪、玉子燒

二、日本食材地圖
* 艾草/草餅 (奈良/京都) → 對應：胎美精、血清高
* 金箔 (金澤) → 對應：胎美精、玻尿酸、痛寶精
* 納豆 (水戶/東京) → 對應：納豆精
* 本鮪/深海魚 (築地/北海道) → 對應：深海鮫、DHA
* 紫蘇/梅干 (和歌山) → 對應：肝寶精

三、節慶時令行事曆
* 1月: 初詣 (黑豆、昆布)
* 2月: 節分豆撒き (大豆)
* 3月: 桃之節句 (草餅、櫻花)
* 4月: 花見 (櫻餅、花見酒)
* 5月: 端午之節句 (柏餅、菖蒲湯)
* 7-8月: 祇園祭、七夕、お盆
* 9-11月: 十五夜、秋分、七五三
* 12月: 冬至柚子湯 (柚子、南瓜)
`;

    // ==== 傳奇小羊哥專屬 Prompt 處理 ====
    let isXiaoYang = (toneStyle === '傳奇小羊哥');
    let xiaoYangInstruction = `
【⚠️ 注意：傳奇小羊哥 降駕模式 ⚠️】
因為使用者選擇了「傳奇小羊哥」風格，你必須且只能完全使用以下「小羊導遊」的人設與 7 步公式來撰寫講稿！請覆蓋掉常規的 6 層 DNA 邏輯，完全依照小羊的戰法！

【小羊口語與語言規則】
1. 每個重要段落開頭必加：「來，想跟各位講...」 或 「來，麻煩各位聽一下...」
2. 每1-2句結尾加反問：「好不好？」「對不對？」「這講得有沒有道理？」
3. 國台語草根混用：賺錢叫「紅探」、司機叫「運將」、沒意義叫「阿薩不魯」。適度穿插「靠腰」、「厚」、「啦」。講完玩笑要自嘲「開玩笑的啦」。
4. 句型特徵：疊字強調（「真的真的」「非常非常」），而且態度要像關心人的大哥，亦莊亦諧。

【小羊專屬 7 步銷售心法公式 (請按照此順序寫滿講稿)】
STEP 1 權威破冰：開場亮出超猛經歷（帶團20年、去年來日本49趟...）。
STEP 2 關心痛點：針對客人當下狀態（如：大家坐飛機累了）直接切入台灣人常見健康痛點（水質差、大腸癌、過勞）。
STEP 3 講古鋪陳：帶入驚悚或強烈的歷史典故（如二戰731部隊生化精華、泡沫經濟、明治維新），用歷史神話化產品背景。
STEP 4 反向推薦 (核心所在)：先叫客人「等等去藥妝店千萬【不要買】」市面上最紅的觀光客商品，指出缺點，建立「我怕你們當冤大頭」的絕對信任感。
STEP 5 揭曉真品：「內行的才買這個！」順勢推出光伸免稅店目標商品，搭配名人或數據背書。
STEP 6 降低門檻：算數字給客人聽（「一天才30塊，錢放銀行人在天堂沒用」），並強調台灣買不到，且你會幫他們代辦免稅。
STEP 7 收網互惠：結尾送個無形的人情或請吃東西的預告（「等下我請大家吃泡芙/給大家加菜」），讓客人吃人嘴軟。
`;

    let normalSalesInstruction = `
必須嚴格按照以下6個層次推進，絕不可生硬推銷：
1. 【景點/節慶 開場】：從景點特色或節日破冰。
2. 【名物/食材 切入】：帶入當地食材或傳統物件。
3. 【裝飾學與哲學延伸】：解釋日本人為什麼這麼做千百年的養生智慧。
4. 【旅客痛點連結】：神轉折！連結到旅客的痛點（膝蓋痛、怕冷、睡眠）。
5. 【光伸商品引導】：順水推舟帶出目標商品（如痛寶精、納豆精）。
6. 【🔥 國內限定關門法 🔥】：「日本好東西留給自己人，吃進肚子的指定用藥外面買不到，只有明天光伸免稅店才有！」
`;

    // ==== 模式判斷：火力銷售模式 vs 純故事模式 ====
    let modeInstruction = '';
    let userPromptContent = '';

    if (mode === 'pure_topic') {
      modeInstruction = `
【純文化話題模式 (Pure Culture Mode)】
你的任務是幫導遊寫出一套「充滿文化底蘊、無推銷、引人入勝」的車上導覽話術。
請務必遵守以下3個層次：
1. 【迎賓破冰】：利用當下的車程、天氣或客群狀態破冰。
2. 【景點串聯】：將輸入的多個景點（如金澤的各個景點）找出一個共同的「文化核心」（例如金澤的『加賀百萬石的底氣』或武士精神），用聽故事的方式串起來。
3. 【哲學延伸】：點出日本人值得學習的生活哲學、職人精神或養生法，讓客人覺得這趟旅行收穫滿滿。

⚠️ 絕對禁止：不可提到任何免稅店、不可帶入長輩健康痛點、不可推銷藥物或保健品！

【產出格式要求】
### 🎯 今日導遊話題戰略
(簡短建議：這些景點最好用什麼核心故事去包裝？)

### 📌 深度文化洗禮話術稿
(口語化的講稿，必須完全符合選擇的「語氣風格」)
      `;

      userPromptContent = `請根據以下今日行程與條件，生成導遊的「純文化話題」話術：
- 📅 今天的日期：${currentDate}
- 📍 今日將前往的景點：${locations}
- 🚌 本段車程時間：${driveTime}
- 👥 車上的主要客群：${ageGroup}
- 😁 客人當下狀態：${guestState}
- 🎭 話術風格：${toneStyle}

立刻開始你的頂級說書人表演！`;

    } else {
      
      let baseStrategy = isXiaoYang ? xiaoYangInstruction : normalSalesInstruction;
      let titleName = isXiaoYang ? '小羊哥 7 步洗腦王牌講稿' : '6 層 DNA 王牌鋪墊話術稿';

      modeInstruction = `
【火力銷售鋪墊模式 (Sales Pitch Mode)】
你的任務是幫導遊編寫「單日車上播報與銷售鋪墊」的完美話術。

${baseStrategy}

【產出格式要求】
### 🎯 今日銷售戰略分析
(簡短建議：告訴導遊這段話術的發揮重點)

### 📌 ${titleName}
(將上述邏輯融合成口語化車上廣播稿)
      `;

      userPromptContent = `請根據以下今日行程與條件，生成導遊戰略與話術：
- 📅 今天的日期：${currentDate}
- 📍 今日將前往的景點：${locations}
- 🚌 本段車程時間：${driveTime}
- 😁 客人當下狀態：${guestState}
- 👥 車上的主要客群：${ageGroup}
- ⏳ 距離免稅店天數：${daysToShop} 天
- 💊 準備推銷的光伸商品：${product}
- 🎭 話術風格：${toneStyle}

立刻開始你的表演！`;
    }

    const systemInstruction = `你是一位在日本帶團超過 20 年的頂級王牌導遊。\n${knowledgeBase}\n${modeInstruction}`;

    // 建立備用模型自動降級機制 (解決 503 High Demand 錯誤)
    const fallbackModels = [
      "gemini-2.5-flash",              // 預設首選 (10K RPD, 遇到 503 時切換)
      "gemini-2.5-flash-lite",         // 無敵備用 (Unlimited RPD, 穩定版，保證過關)
      "gemini-3.1-flash-lite-preview", // 超高配額備用 (150K RPD, 預覽版)
      "gemini-3-flash-preview"         // 最終防線 (10K RPD, 預覽版)
    ];

    let lastError: any = null;

    for (const modelName of fallbackModels) {
      try {
        console.log(\`正在嘗試使用模型: \${modelName}\`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPromptContent,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.75,
          },
        });

        if (response.text) {
          return NextResponse.json({ 
            result: response.text, 
            usedModel: modelName 
          });
        }
      } catch (error: any) {
        console.warn(\`模型 \${modelName} 失敗: \${error?.message || JSON.stringify(error)}\`);
        lastError = error;
      }
    }

    return NextResponse.json({ 
      error: lastError?.message ? \`AI 伺服器滿載 (\${lastError.message})\` : "目前所有備用模型皆忙線中，請稍後再試。" 
    }, { status: 500 });
    
  } catch (error: any) {
    console.error("System Error:", error);
    return NextResponse.json({ error: error?.message || "內部伺服器設定錯誤" }, { status: 500 });
  }
}
