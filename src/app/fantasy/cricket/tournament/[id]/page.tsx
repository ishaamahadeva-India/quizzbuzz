'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, Calendar, MapPin, Users, DollarSign, Play, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SocialShare } from '@/components/social-share';
import type { CricketTournament, TournamentEvent, UserProfile } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { addTournamentEntry, getUserTournamentEntry } from '@/firebase/firestore/tournament-entries';
import { ImageAdGate } from '@/components/ads/image-ad-gate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AnimatedSponsorTile } from '@/components/fantasy/animated-sponsor-tile';

export default function TournamentPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const tournamentRef = firestore ? doc(firestore, 'cricket-tournaments', tournamentId) : null;
  const { data: tournament, isLoading } = useDoc(tournamentRef);
  
  const eventsRef = firestore ? collection(firestore, 'cricket-tournaments', tournamentId, 'events') : null;
  const { data: events } = useCollection(eventsRef);
  
  const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
  const { data: userProfile } = useDoc(userProfileRef);

  // Fetch user's predictions for this tournament
  const predictionsRef = firestore ? collection(firestore, 'tournament-predictions') : null;
  const predictionsQuery = firestore && user && tournamentId
    ? query(
        predictionsRef!,
        where('userId', '==', user.uid),
        where('tournamentId', '==', tournamentId)
      )
    : null;
  const { data: userPredictions } = useCollection(predictionsQuery);

  // Create a map of event IDs that have predictions
  const submittedEventIds = useMemo(() => {
    if (!userPredictions) return new Set<string>();
    return new Set(userPredictions.map((p: any) => p.eventId));
  }, [userPredictions]);

  const [hasEntry, setHasEntry] = useState(false);
  const [isCheckingEntry, setIsCheckingEntry] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);

  // Check if user has already joined
  useEffect(() => {
    const checkEntry = async () => {
      if (!firestore || !user || !tournamentId) {
        setIsCheckingEntry(false);
        return;
      }

      try {
        const entry = await getUserTournamentEntry(firestore, tournamentId, user.uid);
        setHasEntry(!!entry);
      } catch (error) {
        console.error('Error checking tournament entry:', error);
      } finally {
        setIsCheckingEntry(false);
      }
    };

    checkEntry();
  }, [firestore, user, tournamentId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tournament) {
    notFound();
  }

  const startDate = tournament.startDate instanceof Date 
    ? tournament.startDate 
    : (tournament.startDate as any)?.seconds 
    ? new Date((tournament.startDate as any).seconds * 1000)
    : new Date();
  
  const endDate = tournament.endDate instanceof Date 
    ? tournament.endDate 
    : (tournament.endDate as any)?.seconds 
    ? new Date((tournament.endDate as any).seconds * 1000)
    : new Date();

  const isLive = tournament.status === 'live';
  const isUpcoming = tournament.status === 'upcoming';
  const isCompleted = tournament.status === 'completed';

  const handleJoinTournament = async () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to join tournaments.',
      });
      return;
    }

    // Check entry method
    const entryMethod = tournament.entryMethod || tournament.entryFee?.type || 'free';

    // Show ad gate for all tournaments (user can skip if not required)
    // If ad_watch, ad is required; otherwise, it's optional
    const isAdRequired = entryMethod === 'ad_watch';
    
    // Check if user has already viewed an ad for this tournament
    const hasViewedAd = localStorage.getItem(`ad-viewed-${tournamentId}-${user.uid}`);
    
    if (!hasViewedAd) {
      setShowAdGate(true);
      setJoinDialogOpen(false);
      return;
    }

    // If ad_watch and no ad viewed, don't proceed
    if (entryMethod === 'ad_watch' && !hasViewedAd) {
      return;
    }

    if (tournament.entryFee?.type === 'paid' && !selectedTier) {
      toast({
        variant: 'destructive',
        title: 'Selection Required',
        description: 'Please select an entry tier.',
      });
      return;
    }

    setIsJoining(true);

    try {
      const entryData: any = {
        userId: user.uid,
        tournamentId,
        entryMethod: entryMethod,
        paymentStatus: tournament.entryFee?.type === 'free' ? 'paid' as const : 'pending' as const,
      };

      // Only add entryFee if it's a paid tournament with a selected tier
      if (tournament.entryFee?.type === 'paid' && selectedTier) {
        entryData.entryFee = parseFloat(selectedTier);
        entryData.entryFeeTier = tournament.entryFee.tiers?.find((t: any) => t.amount.toString() === selectedTier)?.label;
      }

      // Only add location if available
      if (userProfile?.city) {
        entryData.city = userProfile.city;
      }
      if (userProfile?.state) {
        entryData.state = userProfile.state;
      }

      await addTournamentEntry(firestore, entryData);

      toast({
        title: 'Successfully Joined!',
        description: tournament.entryFee?.type === 'free' 
          ? 'You have successfully registered for this tournament.'
          : 'Your registration is pending payment confirmation.',
      });

      setHasEntry(true);
      setJoinDialogOpen(false);
      
      // Refresh page to show updated status
      router.refresh();
    } catch (error) {
      console.error('Error joining tournament:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'There was an error joining the tournament. Please try again.',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleAdGateComplete = async (adViewId?: string, advertisementId?: string) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to join tournaments.',
      });
      return;
    }

    // Mark ad as viewed
    if (adViewId && user) {
      localStorage.setItem(`ad-viewed-${tournamentId}-${user.uid}`, 'true');
    }

    setShowAdGate(false);
    setIsJoining(true);

    // Check entry method
    const entryMethod = tournament.entryMethod || tournament.entryFee?.type || 'free';

    try {
      const entryData: any = {
        userId: user.uid,
        tournamentId,
        entryMethod: entryMethod === 'ad_watch' ? 'ad_watch' : entryMethod,
        paymentStatus: entryMethod === 'free' || entryMethod === 'ad_watch' ? 'paid' as const : 'pending' as const,
      };

      // Link ad view if available
      if (adViewId) {
        entryData.adViewId = adViewId;
      }
      if (advertisementId) {
        entryData.advertisementId = advertisementId;
      }

      // Add location if available
      if (userProfile?.city) {
        entryData.city = userProfile.city;
      }
      if (userProfile?.state) {
        entryData.state = userProfile.state;
      }

      await addTournamentEntry(firestore, entryData);

      toast({
        title: 'Successfully Joined!',
        description: 'You have successfully registered for this tournament by viewing the sponsor ad.',
      });

      setHasEntry(true);
      router.refresh();
    } catch (error) {
      console.error('Error joining tournament after ad:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'There was an error joining the tournament. Please try again.',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleAdGateCancel = () => {
    setShowAdGate(false);
  };

  return (
    <>
      {/* Image Ad Gate - shows when user clicks join (for all tournaments) */}
      {showAdGate && (
        <ImageAdGate
          tournamentId={tournamentId}
          onComplete={handleAdGateComplete}
          onCancel={handleAdGateCancel}
          required={tournament.entryMethod === 'ad_watch' || tournament.entryFee?.type === 'ad_watch'}
        />
      )}
      
      <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" asChild className="-ml-2 md:-ml-0">
          <Link href="/fantasy/cricket">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Cricket Fantasy</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
        {tournament && (
          <SocialShare
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={`${tournament.name} - Cricket Tournament`}
            description={tournament.description || `Join the ${tournament.name} fantasy tournament!`}
            imageUrl={tournament.sponsorLogo}
            variant="outline"
          />
        )}
      </div>

      <div className="space-y-6">
        {/* Tournament Header */}
        <Card className={`border-2 ${isLive ? 'border-primary ring-2 ring-primary/20' : ''}`}>
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className={`w-8 h-8 ${isLive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-3xl">{tournament.name}</CardTitle>
                  {isLive && (
                    <Badge className="bg-primary text-primary-foreground animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge variant={isLive ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                    {tournament.format}
                  </Badge>
                  <Badge variant="outline">{tournament.status}</Badge>
                  {tournament.visibility === 'public' && (
                    <Badge variant="outline">Public</Badge>
                  )}
                </div>
                {tournament.description && (
                  <CardDescription className="mt-3 text-base">
                    {tournament.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{startDate.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-semibold">{endDate.toLocaleDateString()}</p>
                </div>
              </div>
              {tournament.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Venue</p>
                    <p className="font-semibold text-sm">{tournament.venue}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Teams</p>
                  <p className="font-semibold">{tournament.teams?.length || 0}</p>
                </div>
              </div>
            </div>

            {tournament.prizePool && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Prize Pool</p>
                    <p className="text-2xl font-bold text-primary">{tournament.prizePool}</p>
                  </div>
                  {tournament.sponsorName && (
                    <div className="text-right">
                      <AnimatedSponsorTile
                        sponsorName={tournament.sponsorName}
                        sponsorLogo={tournament.sponsorLogo}
                        sponsorWebsite={tournament.sponsorWebsite}
                        label="Sponsored by"
                        variant="overall"
                        className="text-right"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Tournament Sponsor Display */}
            {tournament.sponsorName && !tournament.prizePool && (
              <AnimatedSponsorTile
                sponsorName={tournament.sponsorName}
                sponsorLogo={tournament.sponsorLogo}
                sponsorWebsite={tournament.sponsorWebsite}
                label="Tournament Sponsor"
                variant="overall"
              />
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Entry Method</p>
                {(tournament.entryMethod === 'ad_watch' || tournament.entryFee?.type === 'ad_watch') ? (
                  <div>
                    <p className="text-lg font-bold text-primary">Watch Ad to Join</p>
                    <p className="text-xs text-muted-foreground mt-1">Free entry by viewing sponsor ad</p>
                  </div>
                ) : tournament.entryFee?.type === 'free' ? (
                  <p className="text-lg font-bold text-green-600">Free Entry</p>
                ) : tournament.entryFee?.tiers ? (
                  <div className="flex gap-2">
                    {tournament.entryFee.tiers.map((tier: any, idx: number) => (
                      <Badge key={idx} variant="outline">₹{tier.amount}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg font-bold">₹{tournament.entryFee?.amount || 'Paid'}</p>
                )}
              </div>
              {!isCompleted && (
                <>
                  {hasEntry ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">You're Registered!</span>
                    </div>
                  ) : (
                    <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="lg" className={isLive ? '' : 'bg-primary'}>
                          {isLive ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Join Tournament
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 mr-2" />
                              Register Now
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Join Tournament</DialogTitle>
                          <DialogDescription>
                            {(tournament.entryMethod === 'ad_watch' || tournament.entryFee?.type === 'ad_watch')
                              ? 'You will need to watch a sponsor ad to join this tournament.'
                              : tournament.entryFee?.type === 'free' 
                              ? 'This tournament is free to join. Click confirm to register.'
                              : 'Select your entry tier and complete registration.'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {tournament.entryFee?.type === 'paid' && tournament.entryFee.tiers && (
                            <div className="space-y-3">
                              <Label>Select Entry Tier</Label>
                              <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                                {tournament.entryFee.tiers.map((tier: any, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg">
                                    <RadioGroupItem value={tier.amount.toString()} id={`tier-${idx}`} />
                                    <Label htmlFor={`tier-${idx}`} className="flex-1 cursor-pointer">
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold">{tier.label}</span>
                                        <span className="text-primary font-bold">₹{tier.amount}</span>
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          )}
                          {(tournament.entryMethod === 'ad_watch' || tournament.entryFee?.type === 'ad_watch') && (
                            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                              <p className="text-primary font-semibold mb-2">
                                Watch Ad to Join
                              </p>
                              <p className="text-sm text-muted-foreground">
                                You'll need to view a sponsor advertisement (5 seconds) to join this tournament for free.
                              </p>
                            </div>
                          )}
                          {tournament.entryFee?.type === 'free' && !tournament.entryMethod && (
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                              <p className="text-green-700 dark:text-green-300 font-semibold">
                                Free Entry - No payment required
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setJoinDialogOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleJoinTournament}
                            disabled={isJoining || (tournament.entryFee?.type === 'paid' && !selectedTier)}
                            className="flex-1"
                          >
                            {isJoining ? 'Joining...' : 'Confirm & Join'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participation Guide for Registered Users */}
        {hasEntry && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <CardTitle>You're Registered! Here's How to Participate:</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <p><strong>Wait for Events to Start:</strong> Events will appear below when they become "Live". Check the "Upcoming" tab to see scheduled events.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <p><strong>Click "Predict Now":</strong> When an event status changes to "Live", click the "Predict Now" button to make your prediction.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <p><strong>Submit Your Prediction:</strong> Select your answer, add optional notes, and submit before the event locks.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <p><strong>Earn Points:</strong> Correct predictions earn points based on the event's point value. Check the leaderboard to see your ranking!</p>
                </div>
              </div>
              {events && events.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> Events lock at their specified lock time. Make sure to submit predictions before then!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tournament Events */}
        {events && events.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Tournament Events ({events.length} total)</CardTitle>
              <CardDescription>
                {hasEntry 
                  ? `Make predictions on live events to earn points! ${events.filter((e: any) => e.status === 'live').length} live event(s) available.`
                  : "Register above to participate in tournament events and make predictions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="live" className="w-full">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  <TabsTrigger value="live">
                    Live Events
                    {events.filter((e) => e.status === 'live').length > 0 && (
                      <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                        {events.filter((e) => e.status === 'live').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">
                    Upcoming
                    {events.filter((e) => e.status === 'upcoming').length > 0 && (
                      <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                        {events.filter((e) => e.status === 'upcoming').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {hasEntry && user && (
                    <TabsTrigger value="submitted">
                      Submitted
                      {events.filter((e) => submittedEventIds.has(e.id)).length > 0 && (
                        <Badge variant="default" className="ml-2 px-1.5 py-0 text-xs bg-green-500">
                          {events.filter((e) => submittedEventIds.has(e.id)).length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="all">All Events</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <div className="space-y-3">
                    {events.map((event) => {
                      const hasPrediction = submittedEventIds.has(event.id);
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{event.title}</h4>
                              {hasPrediction && (
                                <Badge variant="default" className="bg-green-500 text-white">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Submitted
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline">{event.points} pts</Badge>
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
                              {event.sponsorName && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  {event.sponsorLogo && (
                                    <img 
                                      src={event.sponsorLogo} 
                                      alt={event.sponsorName}
                                      className="w-3 h-3 rounded object-cover"
                                    />
                                  )}
                                  <span className="text-xs">Sponsored: {event.sponsorName}</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/fantasy/cricket/tournament/${tournamentId}/event/${event.id}`}>
                                {hasPrediction ? 'Update Prediction' : event.status === 'live' ? 'Predict Now' : 'View Details'}
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/fantasy/cricket/tournament/${tournamentId}/leaderboard`}>
                                <Trophy className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="live" className="mt-4">
                  <div className="space-y-3">
                    {events
                      .filter((e) => e.status === 'live')
                      .map((event) => {
                        const hasPrediction = submittedEventIds.has(event.id);
                        return (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-4 border-2 border-primary/30 rounded-lg hover:bg-primary/5 transition-colors bg-primary/5"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{event.title}</h4>
                                <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                                {hasPrediction && (
                                  <Badge variant="default" className="bg-green-500 text-white">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Submitted
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">{event.points} pts</Badge>
                                {event.lockTime && (
                                  <Badge variant="outline" className="text-xs">
                                    Locks: {new Date(event.lockTime).toLocaleString()}
                                  </Badge>
                                )}
                                {event.sponsorName && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    {event.sponsorLogo && (
                                      <img 
                                        src={event.sponsorLogo} 
                                        alt={event.sponsorName}
                                        className="w-3 h-3 rounded object-cover"
                                      />
                                    )}
                                    <span className="text-xs">Sponsored: {event.sponsorName}</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" asChild className="ml-4" variant={hasPrediction ? "outline" : "default"}>
                              <Link href={`/fantasy/cricket/tournament/${tournamentId}/event/${event.id}`}>
                                {hasPrediction ? 'Update Prediction' : 'Predict Now'}
                              </Link>
                            </Button>
                          </div>
                        );
                      })}
                    {events.filter((e) => e.status === 'live').length === 0 && (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-lg font-semibold text-muted-foreground mb-2">
                          No live events at the moment
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Check the "Upcoming" tab to see when events will start
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="upcoming" className="mt-4">
                  <div className="space-y-3">
                    {events
                      .filter((e) => e.status === 'upcoming')
                      .map((event) => {
                        const startDate = event.startDate instanceof Date 
                          ? event.startDate 
                          : (event.startDate as any)?.seconds 
                          ? new Date((event.startDate as any).seconds * 1000)
                          : null;
                        const hasPrediction = submittedEventIds.has(event.id);
                        return (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{event.title}</h4>
                                {hasPrediction && (
                                  <Badge variant="default" className="bg-green-500 text-white">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Submitted
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">{event.points} pts</Badge>
                                {startDate && (
                                  <Badge variant="outline" className="text-xs">
                                    Starts: {startDate.toLocaleString()}
                                  </Badge>
                                )}
                                {event.lockTime && (
                                  <Badge variant="outline" className="text-xs">
                                    Locks: {new Date(event.lockTime).toLocaleString()}
                                  </Badge>
                                )}
                                {event.sponsorName && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    {event.sponsorLogo && (
                                      <img 
                                        src={event.sponsorLogo} 
                                        alt={event.sponsorName}
                                        className="w-3 h-3 rounded object-cover"
                                      />
                                    )}
                                    <span className="text-xs">Sponsored: {event.sponsorName}</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild className="ml-4">
                              <Link href={`/fantasy/cricket/tournament/${tournamentId}/event/${event.id}`}>
                                {hasPrediction ? 'Update Prediction' : 'View Details'}
                              </Link>
                            </Button>
                          </div>
                        );
                      })}
                    {events.filter((e) => e.status === 'upcoming').length === 0 && (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-lg font-semibold text-muted-foreground mb-2">
                          No upcoming events
                        </p>
                        <p className="text-sm text-muted-foreground">
                          New events will appear here when they are scheduled
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                {hasEntry && user && (
                  <TabsContent value="submitted" className="mt-4">
                    <div className="space-y-3">
                      {events
                        .filter((e) => submittedEventIds.has(e.id))
                        .map((event) => {
                          const prediction = userPredictions?.find((p: any) => p.eventId === event.id);
                          const startDate = event.startDate instanceof Date 
                            ? event.startDate 
                            : (event.startDate as any)?.seconds 
                            ? new Date((event.startDate as any).seconds * 1000)
                            : null;
                          return (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors bg-green-50/50 dark:bg-green-950/10"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{event.title}</h4>
                                  <Badge variant="default" className="bg-green-500 text-white">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Submitted
                                  </Badge>
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
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                                {prediction && (
                                  <div className="mb-2 p-2 bg-background rounded border border-green-200 dark:border-green-800">
                                    <p className="text-xs text-muted-foreground mb-1">Your Prediction:</p>
                                    <p className="text-sm font-medium">
                                      {Array.isArray(prediction.prediction) 
                                        ? prediction.prediction.join(', ')
                                        : prediction.prediction}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline">{event.points} pts</Badge>
                                  {startDate && (
                                    <Badge variant="outline" className="text-xs">
                                      Starts: {startDate.toLocaleString()}
                                    </Badge>
                                  )}
                                  {event.lockTime && (
                                    <Badge variant="outline" className="text-xs">
                                      Locks: {new Date(event.lockTime).toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/fantasy/cricket/tournament/${tournamentId}/event/${event.id}`}>
                                    {event.status === 'live' || event.status === 'upcoming' ? 'Update Prediction' : 'View Prediction'}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      {events.filter((e) => submittedEventIds.has(e.id)).length === 0 && (
                        <div className="text-center py-12">
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-lg font-semibold text-muted-foreground mb-2">
                            No submitted predictions yet
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Make predictions on live events to see them here
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-2">
                {hasEntry 
                  ? "Events for this tournament will appear here when they are created and set to 'Live' status."
                  : "Events for this tournament will appear here when they are created. Register first to participate!"}
              </p>
              {hasEntry && (
                <p className="text-xs text-muted-foreground mt-2">
                  Admin Note: Make sure events are added to this tournament and their status is set to "Live" for them to appear here.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}

