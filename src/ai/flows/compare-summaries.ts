'use server';

/**
 * @fileOverview A flow for comparing a user's summary against an AI-generated summary.
 * 
 * ⚠️ DISABLED FOR VERSION 1.0 - Will be re-enabled in Version 2.0
 * This flow is currently disabled as the Play section (Intel Briefing) is hidden.
 * Keep this file for future use when Version 2.0 launches.
 *
 * - compareSummaries - A function that compares two summaries based on an original article.
 * - CompareSummariesInput - The input type for the compareSummaries function.
 * - CompareSummariesOutput - The return type for the compareSummaries function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareSummariesInputSchema = z.object({
  articleText: z.string().describe('The full original article text.'),
  aiSummary: z.string().describe("The AI-generated summary of the article."),
  userSummary: z.string().describe("The user-written summary of the article."),
});
export type CompareSummariesInput = z.infer<typeof CompareSummariesInputSchema>;


const CompareSummariesOutputSchema = z.object({
  accuracyScore: z.number().min(0).max(100).describe('A score from 0-100 representing how factually accurate the user summary is based on the article.'),
  concisenessScore: z.number().min(0).max(100).describe('A score from 0-100 representing how concise the user summary is.'),
  coverageScore: z.number().min(0).max(100).describe('A score from 0-100 representing how well the user summary covers the key points of the article.'),
  overallScore: z.number().min(0).max(100).describe('A weighted average of the other scores, representing the overall quality of the user summary.'),
  feedback: z.string().describe('Constructive feedback for the user, explaining the scores and suggesting improvements.'),
});
export type CompareSummariesOutput = z.infer<typeof CompareSummariesOutputSchema>;


export async function compareSummaries(input: CompareSummariesInput): Promise<CompareSummariesOutput> {
  return compareSummariesFlow(input);
}


const compareSummariesPrompt = ai.definePrompt({
  name: 'compareSummariesPrompt',
  input: {schema: CompareSummariesInputSchema},
  output: {schema: CompareSummariesOutputSchema},
  prompt: `You are an expert evaluator for summaries. Your task is to compare a user's summary of an article against an expert-level AI summary and the original article text.

  Evaluate the user's summary based on the following criteria and provide scores from 0 to 100 for each:
  1.  **Accuracy**: How factually correct is the user's summary compared to the original article? Penalize any introduction of incorrect information.
  2.  **Conciseness**: How brief and to-the-point is the summary? It should be shorter than the original article but capture the essence. Compare its length and efficiency against the AI summary.
  3.  **Coverage**: Did the user identify and include the most important key points and conclusions from the original article?

  Then, calculate an **Overall Score** as a weighted average (Accuracy: 50%, Coverage: 40%, Conciseness: 10%).

  Finally, provide **constructive feedback** in one or two paragraphs. Explain the reasoning behind the scores and offer specific suggestions for how the user could improve their summarization skills.

  Original Article:
  {{{articleText}}}

  AI Summary (for reference):
  {{{aiSummary}}}

  User's Summary (to be evaluated):
  {{{userSummary}}}
  
  Provide your evaluation now.`,
});


const compareSummariesFlow = ai.defineFlow(
  {
    name: 'compareSummariesFlow',
    inputSchema: CompareSummariesInputSchema,
    outputSchema: CompareSummariesOutputSchema,
  },
  async (input) => {
    const {output} = await compareSummariesPrompt(input);
    if (!output) {
        throw new Error('Failed to generate summary comparison.');
    }
    return output;
  }
);
