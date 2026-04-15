import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, contextScript, toneStyle, history, userMessage } = body;

    if (!apiKey || !userMessage) {
      return NextResponse.json({ error: "參數錯誤：缺少 API Key 或使用者訊息" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 處理特定講稿風格的強制力 (如小羊哥)
    let isXiaoYang = (toneStyle === '傳奇小羊哥');
    let toneInstruction = isXiaoYang ? 
`【強制套用小羊說話規則】
1. 每個重要段落開頭必加：「來，想跟各位講...」 或 「來，麻煩各位聽一下...」
2. 每1-2句結尾加反問：「好不好？」「對不對？」「這講得有沒有道理？」
3. 國台語草根混用：賺錢叫「紅探」、司機叫「運將」、沒意義叫「阿薩不魯」。適度穿插「靠腰」、「厚」、「啦」。講完玩笑要自嘲「開玩笑的啦」。
4. 句型特徵：疊字強調（「真的真的」「非常非常」），態度要像關心人的大哥。
請直接用這個口吻來重新演繹你想補充的歷史故事！` 
: `請務必在示範時，維持『${toneStyle}』的既有語氣風格。`;

    const systemInstruction = `你是一位在日本帶團超過 20 年的頂級王牌導遊導師。
你的學弟妹剛剛產生了一份車上播報稿（附在下方）。現在他們希望能針對講稿中提到的某個知識點（如名詞、歷史底蘊、場景）進行「延伸挖掘與說故事訓練」。

【你的唯一任務】
1. 🌟 挖掘鮮為人知的冷知識（塑造權威的關鍵）：客人不要聽連續劇般的泛泛之談或維基百科大綱！你必須給出「一般觀光客絕對不會知道」的地方野史、真實冷知識或極度具體的小細節（例如：阿松私下存黃金買名馬幫助利家打動信長、兼六園特殊工法的秘辛等）。給出這種「只有老導遊才知道的料」，才能幫導遊建立深不可測的專業權威感！
2. 🌟 拒絕俗套的劇情：如果講到夫妻情深，不要只說「感情好、一起看櫻花」，要給出具體在某次內亂中、或沒錢時，妻子做了什麼驚人的決定。
3. 🎤 進行車上語音示範：在給出前兩點的「超猛冷知識」後，親自示範一段「導遊實際在車上講出這段補充故事」的逐字稿，這段示範必須引人入勝且聽來十分專業。

${toneInstruction}

--- 這是你們剛才正在討論的講稿大綱（供你抓取脈絡） ---
${contextScript || "無提供講稿"}
`;

    // 轉換對話歷史為 SDK 所需格式
    let contents: any[] = [];
    if (history && Array.isArray(history)) {
      contents = history.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    }
    
    // 塞入本次提問
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.1-flash-lite-preview",
      "gemini-3-flash-preview"
    ];

    let lastError: any = null;

    for (const modelName of fallbackModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
          },
        });

        if (response.text) {
          return NextResponse.json({ 
            result: response.text, 
            usedModel: modelName 
          });
        }
      } catch (error: any) {
        lastError = error;
      }
    }

    return NextResponse.json({ 
      error: lastError?.message ? `AI 伺服器滿載 (${lastError.message})` : "系統忙線中，請稍後再試。" 
    }, { status: 500 });
    
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "內部伺服器錯誤" }, { status: 500 });
  }
}
