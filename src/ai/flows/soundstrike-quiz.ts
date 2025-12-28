'use server';

/**
 * @fileOverview Generates a "Soundstrike" quiz with audio movie quotes.
 *
 * - generateSoundstrikeQuiz - A function that generates the quiz.
 * - SoundstrikeQuizInput - The input type for the generateSoundstrikeQuiz function.
 * - SoundstrikeQuizOutput - The return type for the generateSoundstrikeQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { textToSpeech } from './text-to-speech';

const SoundstrikeQuizInputSchema = z.object({
  numQuestions: z
    .number()
    .optional()
    .default(3)
    .describe('The number of questions to generate for the quiz. Defaults to 3.'),
});
export type SoundstrikeQuizInput = z.infer<typeof SoundstrikeQuizInputSchema>;

const SoundstrikeQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The instructional text for the audio clip, e.g., "Identify the movie from this quote:"'),
      audioDataUri: z.string().describe('The audio data URI for the movie quote narration.'),
      options: z.array(z.string()).describe('An array of 4 movie titles, one being the correct answer.'),
      correctAnswerIndex: z
        .number()
        .describe('The index of the correct answer in the options array.'),
      explanation: z.string().describe('An explanation of the quote and the movie it belongs to.'),
    })
  ).describe('An array of quiz questions.'),
});
export type SoundstrikeQuizOutput = z.infer<typeof SoundstrikeQuizOutputSchema>;


export async function generateSoundstrikeQuiz(input: SoundstrikeQuizInput): Promise<SoundstrikeQuizOutput> {
  return generateSoundstrikeQuizFlow(input);
}


const generateSoundstrikePrompt = ai.definePrompt({
  name: 'generateSoundstrikePrompt',
  input: {schema: z.object({ numQuestions: z.number() })},
  output: {schema: z.object({
    quotes: z.array(
        z.object({
            quote: z.string().describe("A famous and recognizable quote from a popular movie."),
            movie: z.string().describe("The movie the quote is from."),
            distractors: z.array(z.string()).describe("Three other plausible but incorrect movie titles to serve as options. They should be from a similar genre or era."),
            explanation: z.string().describe("A brief explanation of the quote's context in the movie.")
        })
    ).length(3)
  })},
  prompt: `You are a movie trivia expert. Generate {{numQuestions}} questions for a "guess the movie from the quote" game.
  
  For each question, provide:
  1. A famous, recognizable movie quote.
  2. The correct movie title.
  3. Three plausible but incorrect movie titles (distractors).
  4. A short explanation of the quote's context.

  Ensure the movies are popular and well-known.`,
});


const generateSoundstrikeQuizFlow = ai.defineFlow(
  {
    name: 'generateSoundstrikeQuizFlow',
    inputSchema: SoundstrikeQuizInputSchema,
    outputSchema: SoundstrikeQuizOutputSchema,
  },
  async input => {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
    }

    const { output } = await generateSoundstrikePrompt(input);
    if (!output?.quotes) {
        throw new Error('Failed to generate quiz content.');
    }
    
    const quizWithAudio = await Promise.all(
        output.quotes.map(async (item) => {
            // Shuffle options
            const options = [item.movie, ...item.distractors].sort(() => Math.random() - 0.5);
            const correctIndex = options.indexOf(item.movie);
            
            // Generate audio for the quote, but make it optional
            // If text-to-speech fails, continue without audio
            let audioDataUri: string | undefined;
            try {
                const narration = await textToSpeech({ text: `"${item.quote}"` });
                audioDataUri = narration.audioDataUri;
            } catch (error) {
                console.warn(`Failed to generate audio for quote: ${item.quote}`, error);
                // Continue without audio - this quiz requires audio, so we'll throw if all fail
            }
            
            if (!audioDataUri) {
                throw new Error(`Failed to generate audio for quote: ${item.quote}`);
            }
            
            return {
                question: 'Identify the movie from this audio quote:',
                audioDataUri: audioDataUri,
                options: options,
                correctAnswerIndex: correctIndex,
                explanation: item.explanation,
            };
        })
    );

    return { quiz: quizWithAudio };
  }
);
