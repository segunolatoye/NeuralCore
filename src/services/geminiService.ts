import { GoogleGenAI, Type } from "@google/genai";
import { LearningSession, AIRecommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const SYSTEM_INSTRUCTION = `
You are the NeuralCore Analytics Engine. Your purpose is to analyze learning history and calculate a precise "Cognitive Debit Score" (DBT).

Definition of Cognitive Debit (DBT):
DBT represents the cumulative neural fatigue and metabolic cost of learning. It is NOT just a per-session score; it is a running status of the user's mental "battery".

Scoring Logic (Algorithmic Guidance):
1. BASE CALCULATION:
   - High Duration (>60m) + High Complexity (>7) = High Debit (+30-50 DBT).
   - Low Energy (<4) during activity = Doubled Debit multiplier.
   - Flow State (>8) = Reduces current session debit by 40%.

2. CUMULATIVE LOAD (CRITICAL):
   - Analyze the "Temporal Gap" between sessions. If multiple High Complexity sessions occur within 4 hours, DBT should compound (add up).
   - If there is a large gap (>8 hours), DBT should naturally decay (reduce) by 30-50 points.
   - If the user reported "Light Review" or high sleep/energy, DBT should reset towards 0.

3. THRESHOLDS:
   - 0-30: Optimal / Fresh.
   - 31-60: Cognitive Strain.
   - 61-85: Neural Burnout Risk (Warning).
   - 86-100: Critical Exhaustion (Immediate Recovery Required).

Your task:
1. Calculate the TOTAL CURRENT Cognitive Debit Score (0-100) reflecting the user's state AFTER the latest session.
2. Provide 3 targeted recommendations based on the current score.
3. Narrative insights using neural analogies.

Return your response in structured JSON.
`;

export async function analyzeLearningPerformance(sessions: LearningSession[]): Promise<{
  debitScore: number;
  recommendations: AIRecommendation[];
  insights: string;
}> {
  const model = "gemini-3.1-pro-preview"; // Use Pro for complex reasoning and better arithmetic
  const currentTime = new Date().toISOString();
  
  // Find the last known debit score to use as a baseline
  const lastSession = sessions.length > 1 ? sessions[sessions.length - 2] : null;
  const baselineDebit = lastSession?.cognitiveDebitScore || 0;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ 
            text: `Current System Time: ${currentTime}
Baseline Debit (before latest session): ${baselineDebit}
            
Full Session History (up to 10):
${JSON.stringify(sessions.slice(-10))}

TASK:
Calculate the NEW cumulative Cognitive Debit (DBT) score for the latest session.
1. START with the Baseline Debit (${baselineDebit}).
2. ADD session cost: Cost = (Duration * Complexity * (10 - Energy)) / 100.
3. MULTIPLY by Session Type factor (Deep Work: 1.5, Passive: 0.5).
4. REDUCE by Flow State: -((FlowRating * 6) * (Cost/10)).
5. APPLY TIME DECAY: Check the time gap between sessions. If > 8 hours passed, subtract 30. If > 24 hours passed, reset near 0.
6. CLAMP result between 0 and 100.

Return ONLY the structured JSON.` 
          }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            debitScore: { type: Type.NUMBER, description: "The calculated CUMULATIVE cognitive debit (0-100)" },
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
            insights: { type: Type.STRING, description: "Technical neural analysis of the current load." }
          },
          required: ['debitScore', 'recommendations', 'insights']
        }
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Neural Analysis Error:", e);
    return {
      debitScore: Math.min(100, Math.max(0, baselineDebit + 10)), // Safe fallback increment
      recommendations: [],
      insights: "Neural connection unstable. Using heuristic estimation."
    };
  }
}
