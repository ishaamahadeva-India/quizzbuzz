
'use client';
import type { DailyNewsQuizOutput } from '@/ai/flows/daily-news-quiz';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Home, RefreshCw, XCircle, Share2, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { updateUserPoints } from '@/firebase/firestore/users';
import { useEffect } from 'react';

type Quiz = DailyNewsQuizOutput['quiz'];

type QuizCompletionProps = {
  quiz: Quiz;
  userAnswers: Record<number, number>;
};

export function QuizCompletion({ quiz, userAnswers }: QuizCompletionProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const score = quiz.reduce((acc, question, index) => {
    if (userAnswers[index] === question.correctAnswerIndex) {
      return acc + 1;
    }
    return acc;
  }, 0);
  const totalQuestions = quiz.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  const pointsEarned = percentage; // 1 point per percentage point

  useEffect(() => {
    if (user && firestore && pointsEarned > 0) {
      updateUserPoints(
        firestore,
        user.uid,
        pointsEarned,
        `Quiz completed: Daily News Quiz`,
        {
          type: 'quiz_completed',
          score,
          totalQuestions,
        }
      ).catch(error => {
        console.error('Failed to update points:', error);
      });
    }
  }, [user, firestore, pointsEarned, score, totalQuestions]);


  const comparisonData = [
    { name: 'You', score: percentage },
    { name: 'Average', score: 72 }, // Placeholder data
  ];
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'I just took a quiz!',
        text: `I scored ${percentage}% on the quiz! Can you beat my score?`,
        url: window.location.href,
      }).catch(error => console.log('Error sharing', error));
    } else {
        navigator.clipboard.writeText(`I scored ${percentage}% on the quiz! Check it out at ${window.location.href}`);
        toast({
            title: 'Link Copied!',
            description: 'Quiz result link copied to your clipboard.',
        });
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8">
      <Card className="mb-8 text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Quiz Complete!</CardTitle>
          <CardDescription>
            You scored {score} out of {totalQuestions}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <p className="text-muted-foreground">Knowledge Score</p>
                <div className="text-6xl font-bold font-code text-primary">
                {percentage}%
                </div>
            </div>
             <div>
                <p className="text-muted-foreground">quizzbuzz Points Earned</p>
                <div className="text-6xl font-bold font-code text-primary flex items-center justify-center gap-2">
                 <Award className="w-12 h-12 text-amber-400" /> {pointsEarned}
                </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold font-headline mb-2">
              Comparison
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--foreground))"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center gap-2 sm:gap-4 flex-wrap">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" /> Share Result
          </Button>
          <Button 
            onClick={() => {
              toast({
                title: 'Coming Soon',
                description: 'More quiz games will be available in Version 2.0. Stay tuned!',
                duration: 3000,
              });
            }}
          >
            Next Quiz <RefreshCw className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>

      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold font-headline">
            Review Your Answers
        </h2>
        <Accordion type="single" collapsible className="w-full">
            {quiz.map((question, index) => {
            const userAnswerIndex = userAnswers[index];
            const isCorrect = userAnswerIndex === question.correctAnswerIndex;
            return (
                <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-start gap-4">
                    {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-1" />
                    ) : (
                        <XCircle className="w-6 h-6 text-destructive shrink-0 mt-1" />
                    )}
                    <span>{question.question}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <div className="pl-10">
                    <div className="p-4 rounded-lg bg-white/5 space-y-2">
                        <p className="text-sm">
                        Your answer:{' '}
                        <span
                            className={`font-semibold ${
                            isCorrect ? 'text-success' : 'text-destructive'
                            }`}
                        >
                            {question.options[userAnswerIndex]}
                        </span>
                        </p>
                        {!isCorrect && (
                        <p className="text-sm">
                            Correct answer:{' '}
                            <span className="font-semibold text-success">
                            {question.options[question.correctAnswerIndex]}
                            </span>
                        </p>
                        )}
                    </div>
                    {question.explanation && (<p className="mt-4 font-serif text-base text-muted-foreground">
                        {question.explanation}
                    </p>)}
                    </div>
                </AccordionContent>
                </AccordionItem>
            );
            })}
        </Accordion>
      </div>

       <div className="py-4 text-center">
         <Button asChild variant="ghost">
           <Link href="/">
             <Home className="w-4 h-4 mr-2" />
             Back to Home
           </Link>
         </Button>
      </div>
    </div>
  );
}
