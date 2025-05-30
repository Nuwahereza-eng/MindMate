
"use server";

import { analyzeSentiment as analyzeSentimentFlow, type SentimentAnalysisInput, type SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis';
import { getMindMateResponse as getMindMateResponseFlow, type MindMateChatInput, type MindMateChatOutput } from '@/ai/flows/mindmate-chat-flow';
import { generatePersonalizedAffirmations as generatePersonalizedAffirmationsFlow, type PersonalizedAffirmationInput, type PersonalizedAffirmationOutput } from '@/ai/flows/personalized-affirmation-flow';
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

export async function getAIChatResponse(
  userInput: string,
  languageCode: string,
  chatHistory: Array<{ role: 'user' | 'model'; content: string }>
): Promise<{ botResponse: string; isCrisisFromAI: boolean }> {
  try {
    const input: MindMateChatInput = {
      message: userInput,
      languageCode,
      chatHistory: chatHistory.length > 0 ? chatHistory : undefined, // Pass undefined if history is empty
    };
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
      isCrisisFromAI: false, 
    };
  }
}

export async function getAIPersonalizedAffirmations(input: PersonalizedAffirmationInput): Promise<PersonalizedAffirmationOutput> {
  try {
    const result = await generatePersonalizedAffirmationsFlow(input);
    return result;
  } catch (error) {
    console.error("Error in getAIPersonalizedAffirmations:", error);
    // Fallback affirmations
    const fallbackAffirmations = [
      "You are valued and strong.",
      "Each day brings new possibilities.",
      "Remember to be gentle with yourself."
    ];
    // Attempt to translate fallback based on language code, very basic
    if (input.languageCode === 'lg') {
       return { affirmations: ["Oli wa muwendo era wa maanyi.", "Buli lunaku luleeta emikisa mipya.", "Jjukira okubeera omukkakkamu gy'oli."] };
    } else if (input.languageCode === 'sw') {
       return { affirmations: ["Unathaminiwa na una nguvu.", "Kila siku huleta fursa mpya.", "Kumbuka kuwa mpole kwako mwenyewe."] };
    } else if (input.languageCode === 'run') {
        return { affirmations: ["Oine omuhendo kandi oine amaani.", "Buri eizooba nirireeta emikisa misya.", "Ijukira okuba omujwahuki ahariiwe."] };
    }
    return { affirmations: fallbackAffirmations };
  }
}
