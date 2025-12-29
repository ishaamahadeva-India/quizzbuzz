
'use server';

/**
 * @fileOverview Generates a "Frame Lock" quiz question.
 * 
 * ⚠️ DISABLED FOR VERSION 1.0 - Will be re-enabled in Version 2.0
 * This flow is currently disabled as the Play section is hidden.
 * Keep this file for future use when Version 2.0 launches.
 *
 * - generateFrameLockQuiz - A function that generates the image-based quiz.
 * - FrameLockQuizOutput - The return type for the generateFrameLockQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import type { Movie } from '@/lib/types';
import { getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// This flow runs on the server, so we need to initialize a server-side instance of Firebase.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);


const FrameLockQuizOutputSchema = z.object({
  question: z.string().describe('The instructional text for the user, which should be "Identify the movie from the frame below."'),
  imageDataUri: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
  options: z.array(z.string()).describe('An array of 4 movie titles, one being the correct answer.'),
  correctAnswerIndex: z.number().describe('The index of the correct answer in the options array.'),
  explanation: z.string().describe('An explanation of the scene depicted and the movie it belongs to.'),
});
export type FrameLockQuizOutput = z.infer<typeof FrameLockQuizOutputSchema>;

// Helper to select a random movie and some distractors
const selectMoviesForQuiz = async () => {
    const moviesSnapshot = await getDocs(query(collection(firestore, 'movies'), limit(50)));
    const movies = moviesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie));

    if (movies.length < 4) {
        throw new Error('Not enough movies in the database to generate a quiz. Please add at least 4 movies.');
    }

    const correctMovieIndex = Math.floor(Math.random() * movies.length);
    const correctMovie = movies.splice(correctMovieIndex, 1)[0];

    // Get 3 random distractors
    const distractors = movies.sort(() => 0.5 - Math.random()).slice(0, 3).map(m => m.title);

    return {
        correctMovie,
        distractors
    };
};


const generateImageForMovieFlow = ai.defineFlow(
    {
        name: 'generateImageForMovieFlow',
        inputSchema: z.object({ movieTitle: z.string(), movieDescription: z.string() }),
        outputSchema: z.string(),
    },
    async ({ movieTitle, movieDescription }) => {
        const { media } = await ai.generate({
            model: 'googleai/imagen-4.0-fast-generate-001',
            prompt: `Generate a single, visually striking and recognizable image that represents an iconic scene or character from the movie "{{movieTitle}}".
    
            Movie Description: {{movieDescription}}
            
            The image should be cinematic, well-composed, and evocative of the film's mood and style, but it should NOT contain any text, logos, or titles. Focus on a key moment, character pose, or setting that a fan of the movie would recognize.
            `,
        });
        if (!media?.url) {
            throw new Error('Image generation failed.');
        }
        return media.url;
    }
);


export async function generateFrameLockQuiz(): Promise<FrameLockQuizOutput> {
    const { correctMovie, distractors } = await selectMoviesForQuiz();

    // Generate the image
    const imageDataUri = await generateImageForMovieFlow({
        movieTitle: correctMovie.title,
        movieDescription: correctMovie.description,
    });
    
    if (!imageDataUri) {
        throw new Error('Failed to generate image for the quiz frame.');
    }

    // Shuffle options
    const options = [correctMovie.title, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctMovie.title);

    return {
        question: "Identify the movie from the frame below.",
        imageDataUri: imageDataUri,
        options: options,
        correctAnswerIndex: correctIndex,
        explanation: `This scene is from "${correctMovie.title}". ${correctMovie.description}`,
    };
}
