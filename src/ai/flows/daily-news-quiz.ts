
'use server';

/**
 * @fileOverview Generates a daily news quiz using Genkit.
 *
 * - generateDailyNewsQuiz - A function that generates the daily news quiz.
 * - DailyNewsQuizInput - The input type for the generateDailyNewsQuiz function.
 * - DailyNewsQuizOutput - The return type for the generateDailyNewsQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { textToSpeech } from './text-to-speech';

const DailyNewsQuizInputSchema = z.object({
  topic: z
    .string()
    .optional()
    .describe('Optional topic to focus the quiz on, e.g., "Technology", "Politics", or "Business". If not provided, the quiz will cover general news.'),
  numQuestions: z
    .number()
    .optional()
    .default(3)
    .describe('The number of questions to generate for the quiz. Defaults to 3.'),
});
export type DailyNewsQuizInput = z.infer<typeof DailyNewsQuizInputSchema>;

const DailyNewsQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers to the question.'),
      correctAnswerIndex: z
        .number()
        .describe('The index of the correct answer in the options array.'),
      explanation: z.string().optional().describe('Explanation of the correct answer.'),
      audioDataUri: z.string().optional().describe('The audio data URI for the question narration.')
    })
  ).describe('An array of quiz questions, options and correct answers.'),
});
export type DailyNewsQuizOutput = z.infer<typeof DailyNewsQuizOutputSchema>;

export async function generateDailyNewsQuiz(input: DailyNewsQuizInput): Promise<DailyNewsQuizOutput> {
  return generateDailyNewsQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: DailyNewsQuizInputSchema},
  output: {schema: DailyNewsQuizOutputSchema},
  prompt: `You are an expert quiz generator, tasked with creating engaging and informative daily news quizzes based on global events from the last 24-48 hours.

  Generate a quiz with {{numQuestions}} questions.
  {{#if topic}}
  Focus the quiz on the topic of {{topic}}.
  {{/if}}
  Each question should have 4 plausible options, one of which is the correct answer.
  Provide a short, insightful explanation for each correct answer.
  
  Ensure the questions are current and relevant.`,
});

const generateDailyNewsQuizFlow = ai.defineFlow(
  {
    name: 'generateDailyNewsQuizFlow',
    inputSchema: DailyNewsQuizInputSchema,
    outputSchema: DailyNewsQuizOutputSchema,
  },
  async input => {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
    }

    const {output} = await generateQuizPrompt(input);
    if (!output?.quiz) {
      throw new Error('Failed to generate quiz content.');
    }
    
    // Generate audio for all questions in parallel, but make it optional
    // If text-to-speech fails, continue without audio
    const narratedQuiz = await Promise.all(
      output.quiz.map(async (q) => {
        try {
          const narration = await textToSpeech({ text: q.question });
          return {
              ...q,
              audioDataUri: narration.audioDataUri,
          };
        } catch (error) {
          console.warn(`Failed to generate audio for question: ${q.question}`, error);
          // Return question without audio if TTS fails
          return {
              ...q,
              audioDataUri: undefined,
          };
        }
      })
    );

    return { quiz: narratedQuiz };
  }
);
