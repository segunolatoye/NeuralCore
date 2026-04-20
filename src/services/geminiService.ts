import { GoogleGenAI, Type } from "@google/genai";
import { LearningSession, AIRecommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const SYSTEM_INSTRUCTION = `
You are the CogniFlow Neural Analytics Engine. Your purpose is to analyze learning sessions and calculate a "Cognitive Debit Score".

Layman definition of Cognitive Debit: 
"Brain Debt" is what happens when you push your brain too hard without enough "gas" (Energy). Like a car engine overheating, if your Brain Debt is high, you'll stop learning effectively and start feeling burned out.

Analysis Parameters:
1. Duration vs Complexity: Longer sessions with high complexity increase debit.
2. Energy Level: Lower energy during high complexity is the primary driver of debit.
3. Distractions: High distractions cause "Context Switching" costs, increasing debit.
4. Flow State: High flow state (being 'in the zone') significantly reduces debit even during hard tasks.
5. Session Type: 'Deep Work' is most taxing; 'Light Review' should have low debit.

Your task is to provide:
1. A calculated Cognitive Debit Score (0-100) for the most recent activity.
2. Targeted recommendations to reduce debit and optimize performance.
3. Narrative insights using layman analogies like 'Battery', 'Fuel', or 'Engine'.

Return your response in structured JSON.
`;

export async function analyzeLearningPerformance(sessions: LearningSession[]): Promise<{
  debitScore: number;
  recommendations: AIRecommendation[];
  insights: string;
}> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [{ text: `Analyze these learning sessions for cognitive debit and performance optimization: ${JSON.stringify(sessions.slice(-5))}` }]
      }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          debitScore: { type: Type.NUMBER, description: "The calculated cognitive debit score for the latest session (0-100)" },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['recovery', 'strategy', 'warning'] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                actionableStep: { type: Type.STRING }
              },
              required: ['type', 'title', 'description', 'actionableStep']
            }
          },
          insights: { type: Type.STRING, description: "Overall analysis of the learning pattern and performance trajectory." }
        },
        required: ['debitScore', 'recommendations', 'insights']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {
      debitScore: 0,
      recommendations: [],
      insights: "Analysis unavailable at the moment."
    };
  }
}
