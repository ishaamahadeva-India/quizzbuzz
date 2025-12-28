'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMatchEvents } from '@/hooks/use-match-events';
import { useEventNotifications } from '@/hooks/use-event-notifications';
import { MatchEventsDisplay } from '@/components/cricket/match-events-display';
import { MatchPhaseIndicator } from '@/components/cricket/match-phase-indicator';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { FantasyMatch } from '@/lib/types';

export default function MatchEventsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const firestore = useFirestore();

  // Use the custom hook for match events and state
  const {
    matchState,
    currentPhase,
    match,
    events,
    eventsByStatus,
    eventsByPhase,
    isLoading,
  } = useMatchEvents(matchId);

  // Enable event notifications
  useEventNotifications({
    matchId,
    enabled: true,
    showBrowserNotifications: false, // Set to true to enable browser notifications
  });

  // Fetch match details
  const matchRef = firestore ? doc(firestore, 'fantasy_matches', matchId) : null;
  const { data: matchData } = useDoc(matchRef);

  const handleEventClick = (event: any) => {
    // Navigate to event prediction page
    router.push(`/fantasy/cricket/match/${matchId}/event/${event.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!match && !matchData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Match not found.</p>
            <Button asChild className="mt-4">
              <Link href="/fantasy/cricket">Back to Matches</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayMatch = match || matchData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/fantasy/cricket/match/${matchId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Match
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {displayMatch?.matchName || `${displayMatch?.team1} vs ${displayMatch?.team2}`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {displayMatch?.format} Match Events
          </p>
        </div>
      </div>

      {/* Match Phase Indicator */}
      {matchState && (
        <MatchPhaseIndicator
          currentPhase={currentPhase}
          matchState={matchState}
        />
      )}

      {/* Events Display */}
      {events && events.length > 0 ? (
        <MatchEventsDisplay
          events={events}
          eventsByStatus={eventsByStatus}
          eventsByPhase={eventsByPhase}
          currentPhase={currentPhase}
          matchState={matchState}
          matchFormat={(displayMatch?.format as 'T20' | 'ODI' | 'Test' | 'IPL') || 'T20'}
          onEventClick={handleEventClick}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No events available for this match yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Events will appear here as they are added to the match.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

