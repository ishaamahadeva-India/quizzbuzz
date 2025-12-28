

import { generateMovieQuiz } from '@/ai/flows/movie-quiz';
import { QuizClient } from '@/components/quiz/quiz-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

import type { Movie } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';


// We need to get a firestore instance on the server.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);


async function getMovie(id: string): Promise<Movie | null> {
    const movieRef = doc(firestore, 'movies', id);
    const movieSnap = await getDoc(movieRef);
    if (!movieSnap.exists()) {
        return null;
    }
    return movieSnap.data() as Movie;
}


export default async function MovieQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovie(id);
  if (!movie) {
    notFound();
  }

  let quizData;
  let quizError = false;
  let errorMessage = 'We couldn\'t generate a quiz for this movie right now. Please try again later.';
  
  try {
    quizData = await generateMovieQuiz({ movieTitle: movie.title, numQuestions: 5 });
  } catch (error) {
    console.error('Failed to generate movie quiz:', error);
    quizError = true;
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('GEMINI_API_KEY')) {
        errorMessage = 'API key is not configured. Please contact the administrator.';
      } else if (error.message.includes('Failed to generate quiz content')) {
        errorMessage = 'The AI model failed to generate quiz content. Please try again.';
      } else {
        errorMessage = error.message || errorMessage;
      }
    }
  }

  if (quizError || !quizData || !quizData.quiz || quizData.quiz.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="text-destructive" />
              Error Generating Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {errorMessage}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left text-xs text-muted-foreground">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                  {quizError ? 'Error occurred during quiz generation' : 'No quiz data returned'}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <QuizClient quiz={quizData.quiz} />;
}
