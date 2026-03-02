import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateElectionDescription = async (title: string, organization: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate a professional and neutral 2-sentence description for a digital election titled "${title}" organized by "${organization}". Focus on transparency and civic duty.`,
    });
    return response.text || "A secure digital election powered by SmartVoteAI.";
  } catch (error) {
    return "A secure digital election powered by SmartVoteAI.";
  }
};
