import { GoogleGenAI } from "@google/genai";

// Use Vite env directly. If not configured, we provide safe fallbacks.
const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
const isConfigured = Boolean(apiKey && apiKey !== 'PLACEHOLDER_API_KEY');

export const generateStoryIdeas = async (topic: string): Promise<string> => {
  if (!isConfigured) {
    // Fallback: return a friendly message instead of calling the API
    return `Recurso de IA indisponível — sem chave configurada. Tente novamente mais tarde ou contate o administrador.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 3 creative and unique story titles and a brief 1-sentence synopsis for a story about: ${topic}. Return them as a simple bulleted list in Portuguese.`,
    });
    return (response as any).text || "Não foi possível gerar ideias.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar ao assistente de IA.";
  }
};

export const enhanceText = async (text: string): Promise<string> => {
  if (!isConfigured) {
    // Fallback: return input text unchanged so the app doesn't break
    return text;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Improve the following text for a story, making it more evocative and correcting grammar, but keeping the same meaning. Respond ONLY with the improved text in Portuguese:\n\n${text}`,
    });
    return (response as any).text || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};