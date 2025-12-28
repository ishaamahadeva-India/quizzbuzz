import { generateSoundstrikeQuiz } from '@/ai/flows/soundstrike-quiz';
import { QuizClient } from '@/components/quiz/quiz-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default async function SoundstrikePage() {
  let quizData;
  let quizError = false;
  let errorMessage = 'We couldn\'t generate the Soundstrike quiz at this moment. Please try again later.';
  
  try {
    quizData = await generateSoundstrikeQuiz({ numQuestions: 3 });
  } catch (error) {
    console.error('Failed to generate Soundstrike quiz:', error);
    quizError = true;
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('GEMINI_API_KEY')) {
        errorMessage = 'API key is not configured. Please contact the administrator.';
      } else if (error.message.includes('Failed to generate quiz content')) {
        errorMessage = 'The AI model failed to generate quiz content. Please try again.';
      } else if (error.message.includes('Failed to generate audio')) {
        errorMessage = 'Failed to generate audio for the quiz. Please try again.';
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
