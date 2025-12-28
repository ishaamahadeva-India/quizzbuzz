'use server';

/**
 * @fileOverview Generates a quiz about a specific movie.
 *
 * - generateMovieQuiz - A function that generates a movie quiz.
 * - MovieQuizInput - The input type for the generateMovieQuiz function.
 * - MovieQuizOutput - The return type for the generateMovieQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MovieQuizInputSchema = z.object({
  movieTitle: z.string().describe('The title of the movie to create a quiz for.'),
  numQuestions: z
    .number()
    .optional()
    .default(5)
    .describe('The number of questions to generate for the quiz. Defaults to 5.'),
});
export type MovieQuizInput = z.infer<typeof MovieQuizInputSchema>;

const MovieQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question about the movie.'),
      options: z.array(z.string()).describe('The possible answers to the question.'),
      correctAnswerIndex: z
        .number()
        .describe('The index of the correct answer in the options array.'),
      explanation: z.string().optional().describe('Explanation of the correct answer.'),
    })
  ).describe('An array of quiz questions, options and correct answers.'),
});
export type MovieQuizOutput = z.infer<typeof MovieQuizOutputSchema>;

export async function generateMovieQuiz(input: MovieQuizInput): Promise<MovieQuizOutput> {
  return generateMovieQuizFlow(input);
}

const generateMovieQuizPrompt = ai.definePrompt({
  name: 'generateMovieQuizPrompt',
  input: {schema: MovieQuizInputSchema},
  output: {schema: MovieQuizOutputSchema},
  prompt: `You are a film buff and expert quiz creator.

  Generate a quiz with {{numQuestions}} questions about the movie "{{movieTitle}}".
  The questions should cover plot points, characters, famous lines, and behind-the-scenes facts.
  
  Each question should have 4 options, one of which is the correct answer.
  Provide a short explanation for each correct answer.
  
  The response should be formatted as a JSON object conforming to the output schema.
  Make sure to include the "explanation" field for each question.
  `,
});

const generateMovieQuizFlow = ai.defineFlow(
  {
    name: 'generateMovieQuizFlow',
    inputSchema: MovieQuizInputSchema,
    outputSchema: MovieQuizOutputSchema,
  },
  async input => {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
    }

    const {output} = await generateMovieQuizPrompt(input);
    if (!output?.quiz) {
      throw new Error('Failed to generate quiz content.');
    }
    return output;
  }
);
