
'use server';
/**
 * @fileOverview A Genkit flow for MindMate's chat functionality.
 *
 * - mindMateChatFlow - A function that handles generating AI responses for the chat.
 * - MindMateChatInput - The input type for the mindMateChatFlow function.
 * - MindMateChatOutput - The return type for the mindMateChatFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MindMateChatInputSchema = z.object({
  message: z.string().describe('The user_s message to the MindMate chatbot.'),
});
export type MindMateChatInput = z.infer<typeof MindMateChatInputSchema>;

const MindMateChatOutputSchema = z.object({
  response: z.string().describe('The AI_s response to the user_s message.'),
});
export type MindMateChatOutput = z.infer<typeof MindMateChatOutputSchema>;

// This wrapper function is what your application code will call.
export async function getMindMateResponse(input: MindMateChatInput): Promise<MindMateChatOutput> {
  return mindMateChatFlow(input);
}

const mindMateChatPrompt = ai.definePrompt({
  name: 'mindMateChatPrompt',
  input: {schema: MindMateChatInputSchema},
  output: {schema: MindMateChatOutputSchema},
  prompt: `You are MindMate, a compassionate, empathetic, and non-judgmental mental health companion. A user has sent you the following message.

User's message: {{{message}}}

Respond in a supportive and understanding way. Offer gentle guidance, a listening ear, or suggest helpful coping strategies if appropriate. Keep your responses concise, natural, and helpful.

VERY IMPORTANT SAFETY PROTOCOL:
If the user's message contains any themes of suicide, self-harm, immediate danger to themselves or others, or indicates a severe mental health crisis:
1. Your primary goal is to gently guide them to seek immediate professional help or use an emergency hotline.
2. Your response MUST end with the exact string "CRISIS_DETECTED_BY_AI". Do not add any text or punctuation after this marker.

Example of a crisis response: "I'm truly concerned to hear you're feeling this way, and I want you to know you're not alone. It's really important to talk to someone who can provide immediate support. Please consider reaching out to a crisis hotline or mental health professional right away. They are there to help. CRISIS_DETECTED_BY_AI"

Example of a non-crisis response: "I hear you, it sounds like you're going through a lot right now. Sometimes just talking about it can help. What's been weighing on your mind the most?"

Remember to always be empathetic and prioritize safety.
`,
});

const mindMateChatFlow = ai.defineFlow(
  {
    name: 'mindMateChatFlow',
    inputSchema: MindMateChatInputSchema,
    outputSchema: MindMateChatOutputSchema,
  },
  async (input) => {
    const {output} = await mindMateChatPrompt(input);
    return output!;
  }
);
