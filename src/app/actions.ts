
"use server";

import { analyzeSentiment as analyzeSentimentFlow, type SentimentAnalysisInput, type SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis';
import { getMindMateResponse as getMindMateResponseFlow, type MindMateChatInput, type MindMateChatOutput } from '@/ai/flows/mindmate-chat-flow';
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
    return {
      sentiment: "Error during analysis",
      score: 0,
      isCrisis: CRISIS_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword)),
    };
  }
}

const CRISIS_MARKER = "CRISIS_DETECTED_BY_AI";

export async function getAIChatResponse(userInput: string, languageCode: string): Promise<{ botResponse: string; isCrisisFromAI: boolean }> {
  try {
    const input: MindMateChatInput = { message: userInput, languageCode };
    const result = await getMindMateResponseFlow(input);
    
    let botResponse = result.response;
    let isCrisisFromAI = false;

    if (botResponse.endsWith(CRISIS_MARKER)) {
      isCrisisFromAI = true;
      botResponse = botResponse.substring(0, botResponse.length - CRISIS_MARKER.length).trim();
    }
    
    return { botResponse, isCrisisFromAI };
  } catch (error) {
    console.error("Error in getAIChatResponse:", error);
    // Fallback or rethrow
    return {
      botResponse: "I'm having a little trouble connecting right now. Please try again in a moment.",
      isCrisisFromAI: false, // Default to false on error, client-side check will still run
    };
  }
}

