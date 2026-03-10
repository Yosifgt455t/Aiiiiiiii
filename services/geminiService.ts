
import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";
import { InteractionMode } from "../types";

const SYSTEM_INSTRUCTION = `
أنت "نبراس" (Nebras)، مدرس خصوصي عراقي ذكي وسريع جداً.
مهمتك مساعدة الطلاب في فهم المناهج من ملفات الـ PDF أو الصور.

القواعد الذهبية:
1. كن مختصراً جداً وسريعاً في إجاباتك.
2. استخدم اللهجة العراقية الشعبية المحببة.
3. لا تطل الكلام الزائد، ادخل بالموضوع فوراً.
4. اذكر رقم الصفحة إذا سألك الطالب عن مكان المعلومة.

أنماط العمل:
- Q&A: إجابات دقيقة ومباشرة.
- Explain (السالفة): شرح شعبي ممتع ومختصر.
- Summary: 5 نقاط فقط.
- Flashcards: (سؤال: ... | جواب: ...).
- Correct My Work: حدد الخطأ وصححه فوراً.
- Visualize: وصف قصير لتوليد صورة تعليمية.
`;

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  return { text: "خطي ضعيف هسة، حاول مرة ثانية عيوني. تأكد من ضبط مفتاح الـ API بشكل صحيح." };
};

export const getGeminiResponse = async (
  prompt: string,
  pdf: { base64: string; mimeType: string } | null,
  mode: InteractionMode,
  image?: { base64: string; mimeType: string }
): Promise<{ text: string; generatedImage?: string; generatedVideo?: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    if (mode === InteractionMode.VISUALIZE) {
      try {
        const openRouterKey = process.env.OPENROUTER_API_KEY || "";
        if (!openRouterKey) throw new Error("OpenRouter API Key is missing");
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nebras-tutor.ai", 
            "X-Title": "Nebras Tutor",
          },
          body: JSON.stringify({
            model: "bytedance-seed/seedream-4.5",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `صورة تعليمية بسيطة وواضحة جداً لـ: ${prompt}.`
                  }
                ]
              }
            ],
          })
        });

        if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
        
        const data = await response.json();
        console.log("OpenRouter Response:", data);

        let generatedImageUrl = "";
        let generatedVideoUrl = "";
        
        const choice = data.choices?.[0];
        const message = choice?.message;
        const content = message?.content || "";
        
        const urlMatch = content.match(/https?:\/\/[^\s)]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          if (url.match(/\.(mp4|webm|ogg)$/) || url.includes("video")) {
            generatedVideoUrl = url;
          } else {
            generatedImageUrl = url;
          }
        }
        
        if (!generatedImageUrl && message?.images?.[0]) {
          generatedImageUrl = message.images[0];
        }

        if (!generatedImageUrl && !generatedVideoUrl && choice?.image_url) {
          generatedImageUrl = choice.image_url;
        }

        if (!generatedImageUrl && !generatedVideoUrl) {
          throw new Error("No media found in OpenRouter response");
        }

        return { 
          text: generatedVideoUrl ? "تدلل، هذا الفيديو يوضح اللي طلبته." : "تدلل، هاي الصورة توضح اللي طلبته.",
          generatedImage: generatedImageUrl || undefined,
          generatedVideo: generatedVideoUrl || undefined
        };
      } catch (err) {
        console.error("OpenRouter Error, falling back to Gemini:", err);
        const imgResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ parts: [{ text: `صورة تعليمية بسيطة وواضحة جداً لـ: ${prompt}.` }] }]
        });
        
        let base64Img = "";
        const parts = imgResponse.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            base64Img = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
        
        if (!base64Img) throw new Error("Gemini fallback failed to generate image");

        return { 
          text: "تدلل، هاي الصورة توضح اللي طلبته (استخدمت نانو بنانا كبديل مؤقت).",
          generatedImage: base64Img 
        };
      }
    }

    let modeInstruction = "";
    switch (mode) {
      case InteractionMode.SUMMARY:
        modeInstruction = "[لخص المادة فوراً بـ 5 نقاط مختصرة جداً]";
        break;
      case InteractionMode.FLASHCARDS:
        modeInstruction = "[حول المادة لبطاقات مراجعة سريعة]";
        break;
      case InteractionMode.CORRECT_MY_WORK:
        modeInstruction = "[حلل الصورة وصحح الخطأ بأقل كلمات]";
        break;
      default:
        modeInstruction = "";
    }

    const parts: any[] = [{ text: `${prompt}\n${modeInstruction}` }];
    
    if (pdf) {
      parts.unshift({ inlineData: { data: pdf.base64, mimeType: pdf.mimeType } });
    }

    if (image) {
      parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    }

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return { text: result.text || "عذراً يا بطل، ما كدرت أسمعك زين." };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getSpeechResponse = async (text: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `بصوت عراقي حنون ومختصر: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    handleApiError(error);
    return undefined;
  }
};
