'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, collection, query, where, getDocs, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { CricketEvent } from '@/lib/types';
import { useMatchEvents } from '@/hooks/use-match-events';
import { EventCountdown } from '@/components/cricket/event-countdown';

type CricketEventPrediction = {
  id?: string;
  userId: string;
  matchId: string;
  eventId: string;
  prediction: string | number | string[]; // The actual prediction value
  predictionType: 'single' | 'multiple' | 'number' | 'text';
  points?: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function MatchEventPredictionPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const eventId = params.eventId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const [event, setEvent] = useState<CricketEvent | null>(null);
  const [prediction, setPrediction] = useState<string>('');
  const [existingPrediction, setExistingPrediction] = useState<CricketEventPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get match events and state
  const { matchState, match } = useMatchEvents(matchId);

  // Fetch event
  useEffect(() => {
    if (!firestore || !matchId || !eventId) return;

    const fetchEvent = async () => {
      try {
        const eventRef = doc(firestore, 'fantasy_matches', matchId, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (eventSnap.exists()) {
          const eventData = { id: eventSnap.id, ...eventSnap.data() } as CricketEvent;
          setEvent(eventData);
        } else {
          toast({
            variant: 'destructive',
            title: 'Event Not Found',
            description: 'The event you are looking for does not exist.',
          });
          router.push(`/fantasy/cricket/match/${matchId}/events`);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load event.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [firestore, matchId, eventId, router]);

  // Fetch existing prediction
  useEffect(() => {
    if (!firestore || !user || !matchId || !eventId) return;

    const fetchPrediction = async () => {
      try {
        const predictionsRef = collection(firestore, 'cricket-event-predictions');
        const q = query(
          predictionsRef,
          where('userId', '==', user.uid),
          where('matchId', '==', matchId),
          where('eventId', '==', eventId)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const predData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data(),
          } as CricketEventPrediction;
          setExistingPrediction(predData);
          setPrediction(String(predData.prediction));
        }
      } catch (error) {
        console.error('Error fetching prediction:', error);
      }
    };

    fetchPrediction();
  }, [firestore, user, matchId, eventId]);

  const handleSubmit = async () => {
    if (!firestore || !user || !event || !prediction.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please make a prediction before submitting.',
      });
      return;
    }

    // Check if event is locked
    if (event.status === 'locked' || event.status === 'completed') {
      toast({
        variant: 'destructive',
        title: 'Event Locked',
        description: 'This event is no longer accepting predictions.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const predictionsRef = collection(firestore, 'cricket-event-predictions');
      const predictionData: Omit<CricketEventPrediction, 'id'> = {
        userId: user.uid,
        matchId,
        eventId,
        prediction: prediction,
        predictionType: event.options ? 'single' : 'text',
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (existingPrediction) {
        // Update existing prediction
        const predRef = doc(firestore, 'cricket-event-predictions', existingPrediction.id!);
        await updateDoc(predRef, {
          prediction: prediction,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Prediction Updated',
          description: 'Your prediction has been updated successfully.',
        });
      } else {
        // Create new prediction
        await addDoc(predictionsRef, {
          ...predictionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Prediction Submitted',
          description: 'Your prediction has been submitted successfully.',
        });
      }

      router.push(`/fantasy/cricket/match/${matchId}/events`);
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit prediction. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Event not found.</p>
            <Button asChild className="mt-4">
              <Link href={`/fantasy/cricket/match/${matchId}/events`}>Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLocked = event.status === 'locked' || event.status === 'completed';
  const canPredict = event.status === 'live' && !isLocked;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/fantasy/cricket/match/${matchId}/events`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>
      </div>

      {/* Event Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <CardDescription className="mt-2">{event.description}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={event.status === 'live' ? 'default' : 'secondary'}>
                {event.status === 'live' && <Zap className="h-3 w-3 mr-1" />}
                {event.status === 'locked' && <Lock className="h-3 w-3 mr-1" />}
                {event.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                {event.status}
              </Badge>
              {matchState && event.status === 'live' && (
                <EventCountdown
                  event={event}
                  matchState={matchState}
                  format={(match?.format as 'T20' | 'ODI' | 'Test' | 'IPL') || 'T20'}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Info */}
          <div className="flex items-center gap-4">
            <Badge variant="outline">{event.points} points</Badge>
            {event.difficultyLevel && (
              <Badge variant="outline">{event.difficultyLevel}</Badge>
            )}
            {event.category && (
              <Badge variant="secondary">{event.category}</Badge>
            )}
          </div>

          {/* Rules */}
          {event.rules && event.rules.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Rules:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {event.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Prediction Form */}
          {canPredict ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {existingPrediction ? 'Update Your Prediction' : 'Make Your Prediction'}
              </h3>

              {event.options && event.options.length > 0 ? (
                <RadioGroup value={prediction} onValueChange={setPrediction}>
                  {event.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="prediction">Your Prediction</Label>
                  <Textarea
                    id="prediction"
                    value={prediction}
                    onChange={(e) => setPrediction(e.target.value)}
                    placeholder="Enter your prediction..."
                    rows={4}
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !prediction.trim()}
                className="w-full"
                size="lg"
              >
                {isSubmitting
                  ? 'Submitting...'
                  : existingPrediction
                  ? 'Update Prediction'
                  : 'Submit Prediction'}
              </Button>
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <p>
                  {event.status === 'locked'
                    ? 'This event is locked. Predictions are no longer accepted.'
                    : event.status === 'completed'
                    ? 'This event is completed. Results are available.'
                    : 'This event is not yet available for predictions.'}
                </p>
              </div>
            </div>
          )}

          {/* Existing Prediction Display */}
          {existingPrediction && canPredict && (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✓ You have already made a prediction: <strong>{existingPrediction.prediction}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You can update it before the event locks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

