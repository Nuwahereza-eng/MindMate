// use server'
'use server';

/**
 * @fileOverview Sentiment analysis AI agent.
 *
 * - analyzeSentiment - A function that analyzes the sentiment of a given text.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysisOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SentimentAnalysisInputSchema = z.object({
  text: z.string().describe('The text to analyze for sentiment.'),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;

const SentimentAnalysisOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The sentiment of the text (positive, negative, or neutral), and any associated emotions such as joy, sadness, anger, or fear.'
    ),
  score: z.number().describe('A numerical score representing the sentiment strength.'),
});
export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutputSchema>;

export async function analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
  return sentimentAnalysisFlow(input);
}

const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: {schema: SentimentAnalysisInputSchema},
  output: {schema: SentimentAnalysisOutputSchema},
  prompt: `Analyze the sentiment of the following text and provide a sentiment analysis:

Text: {{{text}}}

Provide a sentiment (positive, negative, or neutral) and a numerical score between -1 and 1, where -1 is very negative, 0 is neutral, and 1 is very positive.  Also detect any associated emotions, such as joy, sadness, anger, or fear.

Output in JSON format:
{
  "sentiment": "sentiment",
  "score": score,
}
`,
});

const sentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'sentimentAnalysisFlow',
    inputSchema: SentimentAnalysisInputSchema,
    outputSchema: SentimentAnalysisOutputSchema,
  },
  async input => {
    const {output} = await sentimentAnalysisPrompt(input);
    return output!;
  }
);
