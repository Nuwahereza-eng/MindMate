
'use server';
/**
 * @fileOverview A Genkit flow for generating personalized daily affirmations.
 *
 * - getPersonalizedAffirmations - A function that generates affirmations based on user data.
 * - PersonalizedAffirmationInput - The input type for the flow.
 * - PersonalizedAffirmationOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Message, MoodEntry, JournalEntry } from '@/lib/constants'; // Assuming types are here

// Define a Zod schema for individual message, mood, and journal entries if not already strictly defined for AI
const SimpleMessageSchema = z.object({
  type: z.enum(['user', 'bot', 'system']),
  content: z.string(),
  timestamp: z.string().describe("ISO date string for when the message was sent"), // Keep as string, AI doesn't need Date object
});

const SimpleMoodEntrySchema = z.object({
  date: z.string().describe("Date of mood entry in YYYY-MM-DD format"),
  mood: z.number().describe("Mood rating from 1 (very negative) to 10 (very positive)"),
  note: z.string().optional().describe("Optional note accompanying the mood entry"),
});

const SimpleJournalEntrySchema = z.object({
  content: z.string().describe("The textual content of the journal entry"),
  date: z.string().describe("Date of journal entry in YYYY-MM-DD format"),
  timestamp: z.string().describe("ISO date string for when the entry was created"), // Keep as string
});


const PersonalizedAffirmationInputSchema = z.object({
  moodHistory: z.array(SimpleMoodEntrySchema).optional().describe('Recent mood history of the user (e.g., last 7 entries).'),
  journalEntries: z.array(SimpleJournalEntrySchema).optional().describe('Recent journal entries from the user (e.g., last 3-5 entries).'),
  chatHistory: z.array(SimpleMessageSchema).optional().describe('Recent chat messages between the user and the AI (e.g., last 10-20 messages).'),
  languageCode: z.string().describe("The ISO 639-1 language code for the desired affirmations language (e.g., 'en', 'lg', 'sw', 'run')."),
});
export type PersonalizedAffirmationInput = z.infer<typeof PersonalizedAffirmationInputSchema>;

const PersonalizedAffirmationOutputSchema = z.object({
  affirmations: z.array(z.string()).describe('An array of 3-5 personalized, short, positive, and uplifting daily affirmations.'),
});
export type PersonalizedAffirmationOutput = z.infer<typeof PersonalizedAffirmationOutputSchema>;

export async function generatePersonalizedAffirmations(input: PersonalizedAffirmationInput): Promise<PersonalizedAffirmationOutput> {
  return personalizedAffirmationFlow(input);
}

const affirmationPrompt = ai.definePrompt({
  name: 'personalizedAffirmationPrompt',
  input: {schema: PersonalizedAffirmationInputSchema},
  output: {schema: PersonalizedAffirmationOutputSchema},
  prompt: `You are a compassionate and insightful AI companion. Your task is to generate 3-5 short, positive, and uplifting daily affirmations for a user based on their recent experiences and feelings.
The affirmations should be tailored to the information provided from their mood history, journal entries, and chat conversations.
Generate the affirmations in the language specified by the language code: {{{languageCode}}}.

Here is the recent data provided by the user:

{{#if moodHistory.length}}
Recent Moods:
{{#each moodHistory}}
- On {{this.date}}, mood was {{this.mood}}/10. Note: {{this.note_}}
{{/each}}
{{/if}}

{{#if journalEntries.length}}
Recent Journal Entries:
{{#each journalEntries}}
- Entry from {{this.date}}: "{{this.content}}"
{{/each}}
{{/if}}

{{#if chatHistory.length}}
Recent Chat Snippets:
{{#each chatHistory}}
- {{this.type}}: "{{this.content}}"
{{/each}}
{{/if}}

Based on this information, provide a list of 3 to 5 supportive and personalized affirmations. Ensure they are concise and encouraging.
If no specific data is provided, generate general positive affirmations.
The affirmations should be in the language corresponding to this code: {{{languageCode}}}. For example, 'en' for English, 'lg' for Luganda, 'sw' for Swahili, 'run' for Runyakitara.
Focus on themes of resilience, self-compassion, hope, and strength where appropriate, or address specific challenges or positive reflections if evident in the data.
`,
});

const personalizedAffirmationFlow = ai.defineFlow(
  {
    name: 'personalizedAffirmationFlow',
    inputSchema: PersonalizedAffirmationInputSchema,
    outputSchema: PersonalizedAffirmationOutputSchema,
  },
  async (input) => {
    // Sanitize/prepare input if necessary, e.g., trim long texts, ensure correct formats for the prompt
    // For simplicity, we'll pass it as is, assuming the client sends reasonably sized arrays.

    const {output} = await affirmationPrompt(input);
    if (!output || !output.affirmations) {
      // Fallback if AI fails to generate affirmations
      return { affirmations: ["You are capable and strong.", "Today is a new opportunity.", "Be kind to yourself."] };
    }
    return output;
  }
);
