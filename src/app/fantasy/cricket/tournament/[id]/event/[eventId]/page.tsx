'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, Calendar, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { CricketTournament, TournamentEvent, UserProfile } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { addTournamentPrediction, updateTournamentPrediction } from '@/firebase/firestore/tournament-predictions';
import { AnimatedSponsorTile } from '@/components/fantasy/animated-sponsor-tile';

export default function TournamentEventPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const eventId = params.eventId as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const tournamentRef = firestore ? doc(firestore, 'cricket-tournaments', tournamentId) : null;
  const { data: tournament, isLoading: tournamentLoading } = useDoc(tournamentRef);
  
  const eventRef = firestore 
    ? doc(firestore, 'cricket-tournaments', tournamentId, 'events', eventId) 
    : null;
  const { data: event, isLoading: eventLoading } = useDoc(eventRef);
  
  const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
  const { data: userProfile } = useDoc(userProfileRef);

  // Check if user has already made a prediction
  const predictionsRef = firestore
    ? collection(firestore, 'tournament-predictions')
    : null;
  const predictionsQuery = firestore && user
    ? query(
        predictionsRef!,
        where('userId', '==', user.uid),
        where('tournamentId', '==', tournamentId),
        where('eventId', '==', eventId)
      )
    : null;
  const { data: existingPredictions } = useCollection(predictionsQuery);

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // For multi-select
  const [textInput, setTextInput] = useState<string>(''); // For text-based predictions (player names, etc.)
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Event types that require text input (player/team names)
  const textInputEventTypes = [
    'top_run_scorer',
    'top_wicket_taker',
    'tournament_mvp',
    'tournament_winner',
    'tournament_runner_up',
    'most_sixes',
    'best_strike_rate',
    'most_centuries',
    'most_fifties',
    'best_bowling_average',
    'highest_individual_score',
    'fastest_fifty_tournament',
    'fastest_hundred_tournament',
    'points_table_topper',
    'group_topper',
    'group_second_place',
    'semi_finalists',
    'finalists',
    'group_qualifiers',
    'group_qualifier_live',
    'top_2_after_matches',
    'playoff_qualifier',
    'mvp_as_of_today',
  ];

  if (tournamentLoading || eventLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tournament || !event) {
    notFound();
  }

  const isLocked = event.status === 'locked' || (event.lockTime && new Date(event.lockTime) < new Date());
  const hasPrediction = existingPredictions && existingPredictions.length > 0;
  const existingPrediction = hasPrediction ? existingPredictions[0] : null;
  const requiresTextInput = textInputEventTypes.includes(event.eventType);

  const handleSubmit = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to make predictions.',
      });
      return;
    }

    if (isLocked) {
      toast({
        variant: 'destructive',
        title: 'Event Locked',
        description: 'This event is locked and no longer accepts predictions.',
      });
      return;
    }

    if (requiresTextInput) {
      if (!textInput.trim()) {
        toast({
          variant: 'destructive',
          title: 'Input Required',
          description: 'Please enter your prediction (e.g., player name, team name).',
        });
        return;
      }
    } else if (event.multiSelect) {
      if (selectedOptions.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Selection Required',
          description: `Please select ${event.maxSelections || 'at least one'} option(s).`,
        });
        return;
      }
      if (event.maxSelections && selectedOptions.length !== event.maxSelections) {
        toast({
          variant: 'destructive',
          title: 'Invalid Selection',
          description: `Please select exactly ${event.maxSelections} option(s).`,
        });
        return;
      }
    } else {
      if (!selectedOption) {
        toast({
          variant: 'destructive',
          title: 'Selection Required',
          description: 'Please select an option.',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const predictionValue = requiresTextInput 
        ? textInput.trim() 
        : event.multiSelect 
        ? selectedOptions 
        : selectedOption;
        
      const predictionData: any = {
        userId: user.uid,
        tournamentId,
        eventId,
        eventType: event.eventType,
        prediction: predictionValue,
        points: event.points,
        status: 'pending' as const,
      };
      
      // Only include notes if it has a value
      if (notes.trim()) {
        predictionData.notes = notes.trim();
      }

      if (existingPrediction && existingPrediction.id) {
        const updateData: any = {
          prediction: predictionValue,
        };
        // Only include notes if it has a value
        if (notes.trim()) {
          updateData.notes = notes.trim();
        }
        await updateTournamentPrediction(firestore, existingPrediction.id, updateData);
      } else {
        await addTournamentPrediction(firestore, predictionData);
      }

      toast({
        title: 'Prediction Submitted!',
        description: 'Your prediction has been recorded successfully.',
      });

      router.push(`/fantasy/cricket/tournament/${tournamentId}`);
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'There was an error submitting your prediction. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiSelect = (option: string) => {
    setSelectedOptions((prev) => {
      if (prev.includes(option)) {
        return prev.filter((o) => o !== option);
      }
      if (event.maxSelections && prev.length >= event.maxSelections) {
        toast({
          variant: 'destructive',
          title: 'Maximum Selections Reached',
          description: `You can only select ${event.maxSelections} option(s).`,
        });
        return prev;
      }
      return [...prev, option];
    });
  };

  // Load existing prediction if available
  if (existingPrediction && !selectedOption && selectedOptions.length === 0 && !textInput) {
    if (requiresTextInput) {
      setTextInput(typeof existingPrediction.prediction === 'string' ? existingPrediction.prediction : '');
    } else if (event.multiSelect) {
      setSelectedOptions(Array.isArray(existingPrediction.prediction) ? existingPrediction.prediction : []);
    } else {
      setSelectedOption(existingPrediction.prediction || '');
    }
    if (existingPrediction.notes) {
      setNotes(existingPrediction.notes);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/fantasy/cricket/tournament/${tournamentId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournament
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Event Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <Badge
                    variant={
                      event.status === 'live'
                        ? 'destructive'
                        : event.status === 'completed'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {event.status}
                  </Badge>
                  {isLocked && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">{event.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Points</p>
                <p className="font-semibold text-lg">{event.points}</p>
              </div>
              {event.difficultyLevel && (
                <div>
                  <p className="text-muted-foreground">Difficulty</p>
                  <p className="font-semibold capitalize">{event.difficultyLevel}</p>
                </div>
              )}
              {event.lockTime && (
                <div>
                  <p className="text-muted-foreground">Locks At</p>
                  <p className="font-semibold text-xs">
                    {new Date(event.lockTime).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Tournament</p>
                <p className="font-semibold text-xs truncate">{tournament.name}</p>
              </div>
            </div>

            {event.rules && event.rules.length > 0 && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-semibold mb-2">Rules:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {event.rules.map((rule: string, idx: number) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Event Sponsor Display */}
            {event.sponsorName && (
              <AnimatedSponsorTile
                sponsorName={event.sponsorName}
                sponsorLogo={event.sponsorLogo}
                sponsorWebsite={event.sponsorWebsite}
                label="Event Sponsored by"
                variant="event"
              />
            )}
          </CardContent>
        </Card>

        {/* Prediction Form */}
        {!isLocked && (
          <Card>
            <CardHeader>
              <CardTitle>Make Your Prediction</CardTitle>
              <CardDescription>
                {event.multiSelect
                  ? `Select ${event.maxSelections || 'multiple'} option(s)`
                  : 'Select your prediction'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {requiresTextInput ? (
                <div className="space-y-3">
                  <Label htmlFor="prediction-input">
                    {event.eventType.includes('player') || event.eventType.includes('scorer') || event.eventType.includes('wicket') || event.eventType.includes('mvp') || event.eventType.includes('strike') || event.eventType.includes('centuries') || event.eventType.includes('fifties') || event.eventType.includes('bowling') || event.eventType.includes('individual') || event.eventType.includes('fifty') || event.eventType.includes('hundred')
                      ? 'Enter Player Name'
                      : event.eventType.includes('team') || event.eventType.includes('winner') || event.eventType.includes('runner') || event.eventType.includes('finalist') || event.eventType.includes('qualifier') || event.eventType.includes('topper')
                      ? 'Enter Team Name'
                      : 'Enter Your Prediction'}
                  </Label>
                  <Input
                    id="prediction-input"
                    placeholder={
                      event.eventType.includes('player') || event.eventType.includes('scorer') || event.eventType.includes('wicket') || event.eventType.includes('mvp') || event.eventType.includes('strike') || event.eventType.includes('centuries') || event.eventType.includes('fifties') || event.eventType.includes('bowling') || event.eventType.includes('individual') || event.eventType.includes('fifty') || event.eventType.includes('hundred')
                        ? 'e.g., Virat Kohli, MS Dhoni, Rohit Sharma...'
                        : event.eventType.includes('team') || event.eventType.includes('winner') || event.eventType.includes('runner') || event.eventType.includes('finalist') || event.eventType.includes('qualifier') || event.eventType.includes('topper')
                        ? 'e.g., Mumbai Indians, Chennai Super Kings...'
                        : 'Enter your prediction here...'
                    }
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    {event.description || 'Enter the name of the player or team you are predicting.'}
                  </p>
                </div>
              ) : event.options && event.options.length > 0 ? (
                event.multiSelect ? (
                  <div className="space-y-3">
                    <Label>Select {event.maxSelections || 'Multiple'} Option(s)</Label>
                    <div className="space-y-2">
                      {event.options.map((option: string) => (
                        <div
                          key={option}
                          className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleMultiSelect(option)}
                        >
                          <Checkbox
                            checked={selectedOptions.includes(option)}
                            onCheckedChange={() => handleMultiSelect(option)}
                          />
                          <Label className="flex-1 cursor-pointer">{option}</Label>
                        </div>
                      ))}
                    </div>
                    {event.maxSelections && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedOptions.length} / {event.maxSelections}
                      </p>
                    )}
                  </div>
                ) : (
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    <div className="space-y-3">
                      {event.options.map((option: string) => (
                        <div
                          key={option}
                          className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <RadioGroupItem value={option} id={option} />
                          <Label htmlFor={option} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )
              ) : (
                <div className="p-4 border rounded-lg">
                  <AlertCircle className="w-5 h-5 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No prediction options available for this event type. Please contact support.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional context or reasoning for your prediction..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {hasPrediction && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-semibold">You have already submitted a prediction for this event.</p>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Submitting again will update your existing prediction.
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || isLocked || (requiresTextInput ? !textInput.trim() : (!selectedOption && selectedOptions.length === 0))}
              >
                {isSubmitting
                  ? 'Submitting...'
                  : hasPrediction
                  ? 'Update Prediction'
                  : 'Submit Prediction'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isLocked && (
          <Card>
            <CardContent className="py-12 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Event Locked</h3>
              <p className="text-muted-foreground">
                This event is locked and no longer accepts predictions.
                {existingPrediction && (
                  <span className="block mt-2">
                    Your previous prediction has been recorded.
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

