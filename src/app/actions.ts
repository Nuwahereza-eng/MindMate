"use server";

import { analyzeSentiment as analyzeSentimentFlow, type SentimentAnalysisInput, type SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis';
import { CRISIS_KEYWORDS } from '@/lib/constants';

export async function performSentimentAnalysis(text: string): Promise<SentimentAnalysisOutput & { isCrisis: boolean }> {
  try {
    const input: SentimentAnalysisInput = { text };
    const result = await analyzeSentimentFlow(input);
    
    const lowerMessage = text.toLowerCase();
    const isCrisis = CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
    
    return { ...result, isCrisis };
  } catch (error) {
    console.error("Error in performSentimentAnalysis:", error);
    // Fallback or rethrow, depending on desired error handling
    // For now, return a neutral sentiment with error indication
    return {
      sentiment: "Error during analysis",
      score: 0,
      isCrisis: CRISIS_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword)), // Still check for crisis
    };
  }
}
