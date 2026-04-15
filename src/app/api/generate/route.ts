import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, locations, daysToShop, driveTime, guestState, ageGroup, product } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "請在設定中輸入您的 Gemini API Key" },
        { status: 401 }
      );
    }

    if (!locations || !ageGroup || !product) {
      return NextResponse.json(
        { error: "請填寫景點、客群與目標推銷商品等必填欄位" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const systemInstruction = `你是一位在日本帶團超過 20 年的頂級王牌導遊，更是「免稅店銷售」的傳奇人物。
你的任務是幫剛入行的導遊做「單日車上播報與銷售鋪墊」的策略規劃與話術編寫。

【你的話術風格與規則】
1. **策略大師**：你要根據「還有幾天進店」、「當天的景點組合」、「車程長度」及「客人當下精神狀態」來給導遊實用的建議。例如：剛吃飽睡覺不要講太複雜的歷史，快到免稅店的前一天要瘋狂洗腦痛點等。
2. **敢講、敢要求**：語氣熱情、洗腦、有感染力，像是在跟老朋友講真心話。不要客氣。
3. **神轉折**：非常會利用當下的「景點特色」、「歷史」或「天氣」，極度自然、不著痕跡地帶入客群的「健康痛點」。
4. **終極目標**：引導旅客在即將抵達的「光伸免稅店 (Koushin)」購買特定的保健食品或藥品。

【產出格式要求】
請一定要分為以下核心區塊，每一塊都要清晰、切中要害，重點部分可加粗：

### 🎯 今日導遊戰略分析 (Guide Strategy)
(簡短給導遊的建議：根據這幾個景點的組合、車程還有幾天後進店，告訴導遊今天『鋪墊的力道』該放多重？在哪個景點講哪個點最適合？)

### 📌 階段一：景點共鳴開場 (Ice Breaker)
(針對客人當下的狀態與車程，寫一段車上閒聊開場。給出該客群會立刻感興趣的地方冷知識或話題)

### 📌 階段二：痛點帶入與神轉折 (Pain-point Transition)
(從剛才的景點話題，直接切入旅客可能有的健康問題如：心血管、關節短、睡眠不好。要「敢講」，指出這就是為什麼日本老人都能走那麼久的原因)

### 📌 階段三：免稅店藥品銷售引導 (Sales Closing)
(順水推舟帶出指定的日本藥品或保健品。強調「日本人都怎麼保養」、「這是日本國內專供的規格」，並根據「距離進店天數」埋下伏筆。例如若明天進店，就說「大家明天的行程會去光伸，到時候一定要拿哪一瓶...」)`;

    const userPrompt = `請根據以下今日行程與條件，生成導遊的今日戰略與車上鋪墊話術逐字稿：
- 📍 今日規劃的景點：${locations}
- 🚌 本段預估車程：${driveTime || '未提供'}
- 😴 客人當下狀態：${guestState || '未知'}
- ⏳ 距離進光伸免稅店還有：${daysToShop} 天
- 👥 車上的主要客群：${ageGroup}
- 💊 準備重點鋪墊的免稅店商品：${product}

請立刻給出你的最頂級導遊戰略與話術！`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.75,
      },
    });

    if (response.text) {
      return NextResponse.json({ result: response.text });
    } else {
      return NextResponse.json(
        { error: "無法生成內容，請確認 API Key 或稍後再試。" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error?.message || "內部伺服器錯誤" },
      { status: 500 }
    );
  }
}
