
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Clock, ListOrdered, Lock, Trophy, ArrowLeft, User, Award, Building, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SocialShare } from '@/components/social-share';
import { useDoc, useFirestore, useCollection, useUser } from '@/firebase';
import { doc, collection, Timestamp, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import type { FantasyCampaign, FantasyEvent } from '@/lib/types';
import { ImageAdGate } from '@/components/ads/image-ad-gate';

type FantasyCampaignWithId = FantasyCampaign & { id: string };
type FantasyEventWithId = FantasyEvent & { id: string };

// Helper function to convert various date types to Date
function toDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (dateValue instanceof Timestamp) return dateValue.toDate();
    if (dateValue && typeof dateValue.toDate === 'function') return dateValue.toDate();
    if (typeof dateValue === 'number') return new Date(dateValue);
    if (typeof dateValue === 'string') return new Date(dateValue);
    return new Date();
}

function EventCard({ event, campaignId, campaign }: { event: FantasyEventWithId; campaignId: string; campaign?: FantasyCampaignWithId }) {
    const { user } = useUser();
    const firestore = useFirestore();
    
    // Check if user has made a prediction for this event
    const predictionsQuery = firestore && user
        ? query(
            collection(firestore, 'campaign-predictions'),
            where('userId', '==', user.uid),
            where('campaignId', '==', campaignId),
            where('eventId', '==', event.id)
        )
        : null;
    const { data: userPredictions } = useCollection(predictionsQuery);
    const hasAttempted = userPredictions && userPredictions.length > 0;
    
    // Determine event status based on dates
    const now = new Date();
    const startDate = toDate(event.startDate);
    const endDate = event.endDate ? toDate(event.endDate) : null;
    
    const isCompleted = event.status === 'completed' || (endDate && now > endDate);
    const isLive = event.status === 'live' || (startDate <= now && (!endDate || now <= endDate));
    const isUpcoming = event.status === 'upcoming' || (startDate > now);

    // Calculate time remaining for live events
    const getTimeRemaining = () => {
        if (!endDate) return null;
        const diff = endDate.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        return 'Less than a minute';
    };

    // Use direct points property or basePoints from pointsConfig
    const points = event.points || event.pointsConfig?.basePoints || 0;
    // TODO: Fetch user's actual score from their predictions/participations

    return (
        <Card className={`overflow-hidden flex flex-col ${isCompleted ? 'bg-white/5' : ''} ${hasAttempted ? 'border-green-500 border-2' : ''}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className={`text-lg font-headline ${hasAttempted ? 'text-green-600 dark:text-green-400' : ''}`}>
                        {event.title}
                    </CardTitle>
                    {hasAttempted && (
                        <Badge variant="outline" className="bg-green-500/10 border-green-500 text-green-700 dark:text-green-400">
                            <Check className="w-3 h-3 mr-1" />
                            Attempted
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {isLive && (
                        <div className="flex items-center gap-1 text-red-400">
                            <Clock className="w-4 h-4" />
                            <span>Ends in {getTimeRemaining() || 'soon'}</span>
                        </div>
                    )}
                    {isUpcoming && (
                         <div className="flex items-center gap-1">
                            <Lock className="w-4 h-4" />
                            <span>Awaiting Event Start</span>
                        </div>
                    )}
                     {isCompleted && (
                         <div className="flex items-center gap-1 text-green-400">
                            <Check className="w-4 h-4" />
                            <span>Completed</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {/* Sponsor/Brand Display */}
                {campaign?.sponsorName && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                        {campaign.sponsorLogo && (
                            <img 
                                src={campaign.sponsorLogo} 
                                alt={campaign.sponsorName}
                                className="w-4 h-4 object-contain"
                            />
                        )}
                        <span className="font-medium text-primary">Sponsored by {campaign.sponsorName}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-amber-400">
                    <Trophy className="w-4 h-4" />
                    <span className="font-semibold">{points} Points</span>
                </div>
                {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}
            </CardContent>
            <CardContent>
                <Button asChild className="w-full" disabled={isUpcoming}>
                    <Link href={`/fantasy/campaign/${campaignId}/event/${event.id}`}>
                        {isLive && 'Make Prediction'}
                        {isCompleted && 'View Results'}
                        {isUpcoming && 'Prediction Opens Soon'}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default function FantasyMovieCampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();

  // Fetch campaign
  const campaignRef = firestore ? doc(firestore, 'fantasy-campaigns', campaignId) : null;
  const { data: campaign, isLoading: campaignLoading } = useDoc(campaignRef);

  // Fetch events from subcollection
  const eventsRef = firestore
    ? collection(firestore, 'fantasy-campaigns', campaignId, 'events')
    : null;
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useCollection(eventsRef);
  const events = eventsData as FantasyEventWithId[] | undefined;
  
  // Debug logging for events
  useEffect(() => {
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }
    if (eventsData) {
      console.log('Fetched events:', eventsData);
      console.log('Events count:', eventsData.length);
      eventsData.forEach((event, idx) => {
        console.log(`Event ${idx + 1}:`, {
          id: event.id,
          title: event.title,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate
        });
      });
    }
  }, [eventsData, eventsError]);

  // Categorize events by status
  const categorizedEvents = useMemo(() => {
    console.log('📊 Categorizing events. Total events:', events?.length || 0);
    
    if (!events || events.length === 0) {
      console.log('📊 No events to categorize');
      return { live: [], upcoming: [], completed: [] };
    }
    
    const now = new Date();
    const live: FantasyEventWithId[] = [];
    const upcoming: FantasyEventWithId[] = [];
    const completed: FantasyEventWithId[] = [];

    events.forEach((event, idx) => {
      const startDate = toDate(event.startDate);
      const endDate = event.endDate ? toDate(event.endDate) : null;
      
      console.log(`📊 Event ${idx + 1} (${event.title}):`, {
        status: event.status,
        startDate: startDate,
        endDate: endDate,
        now: now,
        startDateValid: !!startDate,
        endDateValid: !!endDate
      });
      
      if (event.status === 'completed' || (endDate && now > endDate)) {
        completed.push(event);
        console.log(`  → Categorized as COMPLETED`);
      } else if (event.status === 'live' || (startDate && startDate <= now && (!endDate || now <= endDate))) {
        live.push(event);
        console.log(`  → Categorized as LIVE`);
      } else if (event.status === 'locked') {
        console.log(`  → SKIPPED (locked status)`);
        // Locked events are not displayed
      } else {
        upcoming.push(event);
        console.log(`  → Categorized as UPCOMING`);
      }
    });

    console.log('📊 Final categorization:', {
      live: live.length,
      upcoming: upcoming.length,
      completed: completed.length
    });

    return { live, upcoming, completed };
  }, [events]);

  // ✅ ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const [showAdGate, setShowAdGate] = useState(false);
  const hasCheckedAdRef = useRef<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  const handleAdGateComplete = useCallback((adViewId?: string, advertisementId?: string) => {
    if (adViewId && user?.uid) {
      localStorage.setItem(`ad-viewed-${campaignId}-${user.uid}`, 'true');
    }
    setShowAdGate(false);
  }, [campaignId, user?.uid]);

  const handleAdGateCancel = useCallback(() => {
    setShowAdGate(false);
  }, []);

  // Show ad gate when user first views the campaign (if not already viewed)
  useEffect(() => {
    // Only check once per campaign/user combination
    const checkKey = `${campaignId}-${user?.uid}`;
    if (!user?.uid || !campaignId) {
      return;
    }
    
    // Prevent multiple checks
    if (hasCheckedAdRef.current === checkKey) {
      return;
    }
    
    // Mark as checked immediately to prevent re-runs
    hasCheckedAdRef.current = checkKey;
    
    // Check if user has already viewed an ad for this campaign
    // Note: ImageAdGate component now handles repeat logic internally
    // We only check localStorage for 'never' repeat interval (backward compatibility)
    const hasViewedBefore = localStorage.getItem(`ad-viewed-${campaignId}-${user.uid}`);
    
    // Always show ad gate - let ImageAdGate component decide based on ad's repeat settings
    // This allows ads with 'always', 'daily', 'weekly' repeat to show multiple times
    setTimeout(() => {
      setShowAdGate(true);
    }, 0);
  }, [user?.uid, campaignId]); // Only depend on stable primitive values

  // Set share URL on client side to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // Get movie title(s)
  const getMovieTitle = (campaign: FantasyCampaignWithId): string => {
    if (campaign.campaignType === 'single_movie' && campaign.movieTitle) {
      return campaign.movieTitle;
    }
    if (campaign.campaignType === 'multiple_movies' && campaign.movies && campaign.movies.length > 0) {
      return `${campaign.movies.length} Movie${campaign.movies.length > 1 ? 's' : ''}`;
    }
    return 'Movie Campaign';
  };

  // ✅ NOW CONDITIONAL RETURNS ARE SAFE (all hooks declared above)
  if (campaignLoading || eventsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold md:text-4xl font-headline">
          Campaign Not Found
        </h1>
        <p className="text-muted-foreground">The campaign you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/fantasy/movie">Back to All Campaigns</Link>
        </Button>
      </div>
    );
  }

  const campaignWithId = campaign as FantasyCampaignWithId;
  const movieTitle = getMovieTitle(campaignWithId);
  // TODO: Calculate total points from user's actual predictions/participations
  const totalPoints = 0;
  
  // TODO: Fetch actual leaderboard data from Firestore
  const leaderboardData: { name: string; score: number; rank: number }[] = [
    { name: 'You', score: totalPoints, rank: 1 }
  ];

  const currentUserRank = leaderboardData.find(p => p.name === 'You')?.rank || 1;

  return (
    <>
      {/* Image Ad Gate - shows when user first views campaign */}
      {showAdGate && (
        <ImageAdGate
          key={`ad-gate-${campaignId}-${user?.uid}`}
          campaignId={campaignId}
          onComplete={handleAdGateComplete}
          onCancel={handleAdGateCancel}
          required={true}
        />
      )}
      
      <div className="space-y-8">
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 -ml-2 md:-ml-4'>
            <Button variant="ghost" asChild>
                <Link href="/fantasy/movie">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Back to All Campaigns</span>
                    <span className="sm:hidden">Back</span>
                </Link>
            </Button>
            <SocialShare
              url={shareUrl}
              title={campaignWithId.title}
              description={`Join the ${movieTitle} fantasy campaign!${campaignWithId.prizePool ? ` Sponsored Rewards Pool: ${campaignWithId.prizePool}` : ''}`}
              imageUrl={campaignWithId.sponsorLogo}
              variant="outline"
            />
        </div>
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-8">
            <div>
                <h1 className="text-3xl font-bold md:text-4xl font-headline">
                    {campaignWithId.title}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Predict events for <span className="font-semibold text-primary">{movieTitle}</span> and win big.
                </p>
                {(campaignWithId.prizePool || campaignWithId.prizeDistribution) && (
                    <div className="mt-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary"/>
                        {campaignWithId.prizeDistribution ? (
                            <Link 
                                href={`/fantasy/campaign/${campaignId}/prizes`}
                                className="font-semibold text-primary hover:underline cursor-pointer"
                            >
                                View Prize Distribution
                            </Link>
                        ) : (
                            <span className="font-semibold text-primary">{campaignWithId.prizePool}</span>
                        )}
                    </div>
                )}
                {campaignWithId.description && (
                    <p className="mt-4 text-muted-foreground">{campaignWithId.description}</p>
                )}
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[200px]'>
                <Card className="text-center p-4">
                    <CardDescription className="mb-2">Total Points</CardDescription>
                    <CardTitle className="font-code text-4xl text-primary break-words">{totalPoints}</CardTitle>
                </Card>
                <Card className="text-center p-4">
                    <CardDescription className="mb-2">Your Rank</CardDescription>
                    <CardTitle className="font-code text-4xl text-primary break-words">#{currentUserRank}</CardTitle>
                </Card>
            </div>
        </div>

        {campaignWithId.sponsorName && (
            <Card className="p-4 bg-gradient-to-r from-primary/10 via-background to-background border-primary/20">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
                    <span className="text-xs font-semibold tracking-widest uppercase text-primary">Sponsored By</span>
                    <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                        <Building className='w-6 h-6 text-primary'/> {campaignWithId.sponsorName}
                    </div>
                </div>
            </Card>
        )}

        {/* Mandatory Compliance Disclosures */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="w-5 h-5" />
              Contest Disclosures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <p className="font-semibold mb-1">1. Free Participation</p>
              <p>This is a FREE skill-based contest. No entry fee or payment is required to participate.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold mb-1">2. Non-Cash Rewards</p>
              <p>All prizes are non-cash promotional rewards. Prizes are not redeemable for cash, wallet balance, or bank transfer.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold mb-1">3. Sponsor-Funded</p>
              <p>All prizes are fully funded by sponsors and partners. No user payments are used to fund rewards.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold mb-1">4. Skill-Based Outcome</p>
              <p>Winners are determined based on skill, knowledge, and performance. No element of chance or luck determines the outcome.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold mb-1">5. Eligibility</p>
              <p>Open to residents of India aged 18 years or older. Employees of sponsors and their immediate family members are not eligible.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold mb-1">6. Prize Distribution</p>
              <p>Prizes will be distributed within 30 days of contest completion. Winners will be notified via in-app notification and/or email.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold mb-1">7. Terms & Conditions</p>
              <p>Participation implies acceptance of the{' '}
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Platform Terms & Conditions
                </Link>.
              </p>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs italic">This platform does not offer gambling, betting, or wagering of any kind.</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="events">Prediction Events</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="events" className="mt-6">
                {eventsError && (
                    <Card className="mb-6 border-destructive">
                        <CardContent className="pt-6">
                            <div className="text-destructive">
                                <strong>Error loading events:</strong> {eventsError.message || 'Unknown error'}
                                <p className="text-sm mt-2">Please check Firestore rules and ensure events subcollection has read permissions.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                {!eventsLoading && events && events.length === 0 && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="text-muted-foreground text-center">
                                <p className="font-semibold mb-2">No events found for this campaign.</p>
                                <p className="text-sm">Events may not have been created yet, or there may be a Firestore rules issue.</p>
                                <p className="text-xs mt-2">Check: Firestore Console → fantasy-campaigns → {campaignId} → events</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                <div className="space-y-8">
                    <div className='space-y-4'>
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <Trophy className="text-primary"/> Live Events ({categorizedEvents.live.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categorizedEvents.live.length > 0 ? (
                                categorizedEvents.live.map(event => (
                                    <EventCard key={event.id} event={event} campaignId={campaignId} campaign={campaign as FantasyCampaignWithId} />
                                ))
                            ) : (
                                <Card className='col-span-full p-6 text-muted-foreground'>
                                    No live events right now. Check back soon!
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <Clock className="text-primary"/> Upcoming Events ({categorizedEvents.upcoming.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categorizedEvents.upcoming.length > 0 ? (
                                categorizedEvents.upcoming.map(event => (
                                    <EventCard key={event.id} event={event} campaignId={campaignId} campaign={campaign as FantasyCampaignWithId} />
                                ))
                            ) : (
                                <Card className='col-span-full p-6 text-muted-foreground'>
                                    No upcoming events scheduled.
                                </Card>
                            )}
                        </div>
                    </div>
                    
                    <div className='space-y-4'>
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <ListOrdered className="text-primary"/> Completed Events ({categorizedEvents.completed.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categorizedEvents.completed.length > 0 ? (
                                categorizedEvents.completed.map(event => (
                                    <EventCard key={event.id} event={event} campaignId={campaignId} campaign={campaign as FantasyCampaignWithId} />
                                ))
                            ) : (
                                <Card className='col-span-full p-6 text-muted-foreground'>
                                    No completed events yet.
                                </Card>
                            )}
                        </div>
                    </div>
                    
                    {/* Debug: Show all events if none are categorized */}
                    {events && events.length > 0 && 
                     categorizedEvents.live.length === 0 && 
                     categorizedEvents.upcoming.length === 0 && 
                     categorizedEvents.completed.length === 0 && (
                        <Card className="border-yellow-500">
                            <CardHeader>
                                <CardTitle className="text-yellow-600">⚠️ Debug: All Events (Uncategorized)</CardTitle>
                                <CardDescription>
                                    {events.length} event(s) found but not categorized. Check dates and status.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {events.map(event => (
                                        <EventCard key={event.id} event={event} campaignId={campaignId} campaign={campaign as FantasyCampaignWithId} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Campaign Leaderboard</CardTitle>
                        <CardDescription>
                            Top predictors for the {movieTitle} campaign
                            {campaignWithId.sponsorName && `, powered by ${campaignWithId.sponsorName}`}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {leaderboardData.length > 0 ? (
                                leaderboardData.map((player) => (
                                    <div key={player.rank} className={`flex items-center p-4 rounded-lg ${player.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-white/5'}`}>
                                        <div className="flex items-center gap-4 w-full">
                                            <span className="font-bold font-code text-lg w-8 text-center text-muted-foreground">
                                                {player.rank}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <User className="w-6 h-6 text-muted-foreground"/>
                                                <span className="font-semibold">{player.name}</span>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2 font-bold font-code text-primary text-lg">
                                                <Award className="w-5 h-5 text-amber-400" />
                                                {player.score}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <Card className='p-6 text-muted-foreground text-center'>
                                    No leaderboard data available yet.
                                </Card>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
    </>
  );
}
