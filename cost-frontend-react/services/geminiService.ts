
import { GoogleGenAI, Type } from "@google/genai";

// Initialize with strictly process.env.API_KEY as required by guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCostAnalysis = async (indicators: any[]) => {
  try {
    const prompt = `As a professional engineering cost accountant, analyze the following project cost indicators:
    ${JSON.stringify(indicators)}
    Provide a concise, 3-sentence executive summary focusing on tax risk and cost efficiency.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a senior cost controller and tax expert for a large construction firm.",
      }
    });

    // Directly access text property from GenerateContentResponse
    return response.text || "无法生成分析。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "智能分析服务暂时不可用。";
  }
};
