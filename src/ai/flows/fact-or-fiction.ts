'use server';

/**
 * @fileOverview A flow for generating a "Fact or Fiction" game from an article.
 * 
 * ⚠️ DISABLED FOR VERSION 1.0 - Will be re-enabled in Version 2.0
 * This flow is currently disabled as the Play section is hidden.
 * Keep this file for future use when Version 2.0 launches.
 *
 * - generateFactOrFiction - A function that creates fact/fiction statements.
 * - FactOrFictionInput - The input type for the generateFactOrFiction function.
 * - FactOrFictionOutput - The return type for the generateFactOrFiction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FactOrFictionInputSchema = z.object({
  articleText: z.string().describe('The text content of the article to generate statements from.'),
  numStatements: z
    .number()
    .optional()
    .default(5)
    .describe('The number of statements to generate. Should be a mix of fact and fiction.'),
});
export type FactOrFictionInput = z.infer<typeof FactOrFictionInputSchema>;


const FactOrFictionOutputSchema = z.object({
  statements: z.array(
    z.object({
      statement: z.string().describe('A statement that is either true or false based on the article.'),
      isFact: z.boolean().describe('Whether the statement is true (a fact) or false (fiction).'),
      explanation: z.string().describe('A brief explanation of why the statement is fact or fiction, citing the article.'),
    })
  ).describe('An array of fact or fiction statements.'),
});
export type FactOrFictionOutput = z.infer<typeof FactOrFictionOutputSchema>;


export async function generateFactOrFiction(input: FactOrFictionInput): Promise<FactOrFictionOutput> {
  return generateFactOrFictionFlow(input);
}


const generateFactOrFictionPrompt = ai.definePrompt({
  name: 'generateFactOrFictionPrompt',
  input: {schema: FactOrFictionInputSchema},
  output: {schema: FactOrFictionOutputSchema},
  prompt: `You are a game designer creating a "Fact or Fiction" challenge based on the provided article text.

  Your task is to generate exactly {{numStatements}} statements derived from the article.
  - Create a mix of true statements (facts) and false statements (fiction).
  - Facts must be directly supported by the text.
  - Fictions should be plausible but incorrect, twisting details from the article.
  - For each statement, provide a brief explanation of why it is a fact or fiction, referencing information from the article.

  Article Text:
  {{{articleText}}}
  
  Generate the statements now.`,
});


const generateFactOrFictionFlow = ai.defineFlow(
  {
    name: 'generateFactOrFictionFlow',
    inputSchema: FactOrFictionInputSchema,
    outputSchema: FactOrFictionOutputSchema,
  },
  async (input) => {
    const {output} = await generateFactOrFictionPrompt(input);
    if (!output?.statements || output.statements.length === 0) {
        throw new Error('Failed to generate fact or fiction content.');
    }
    return output;
  }
);
