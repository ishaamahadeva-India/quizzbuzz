'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Ticket, Trophy, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import type { UserProfile, FantasyMatch } from '@/lib/types';
import { doc, collection } from 'firebase/firestore';
import { DisclaimerModal } from '@/components/fantasy/disclaimer-modal';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type FantasyMatchWithId = FantasyMatch & { id: string };

// Matches will be fetched from Firestore

function SeriesTab() {
    const firestore = useFirestore();
    const tournamentsQuery = firestore ? collection(firestore, 'cricket-tournaments') : null;
    const { data: tournaments, isLoading } = useCollection(tournamentsQuery);
    const [isClient, setIsClient] = useState(false);
    
    // Ensure we're on client-side to prevent hydration mismatches
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!tournaments || tournaments.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">No Series Available</p>
                    <p className="text-sm mt-2">Check back soon for upcoming series like T20 World Cup and IPL 2026!</p>
                    <Button asChild className="mt-4" variant="outline">
                        <Link href="/fantasy">Back to Fantasy Hub</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Helper function to format dates consistently (DD/MM/YYYY format)
    // Always use same format to prevent hydration mismatch
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    // Sort tournaments: live first, then upcoming, then completed
    // Use useMemo to prevent hydration mismatches (client-side only)
    const sortedTournaments = useMemo(() => {
        if (!tournaments) return [];
        return [...tournaments].sort((a, b) => {
            const statusOrder = { live: 0, upcoming: 1, completed: 2 };
            const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
            const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
            if (aOrder !== bOrder) return aOrder - bOrder;
            
            // If same status, sort by start date
            const aDate = a.startDate?.seconds ? new Date(a.startDate.seconds * 1000) : new Date(0);
            const bDate = b.startDate?.seconds ? new Date(b.startDate.seconds * 1000) : new Date(0);
            return bDate.getTime() - aDate.getTime();
        });
    }, [tournaments]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTournaments.map((tournament) => {
                    // Format dates consistently (avoid locale-dependent toLocaleDateString)
                    const startDate = tournament.startDate?.seconds 
                        ? new Date(tournament.startDate.seconds * 1000) 
                        : null;
                    const endDate = tournament.endDate?.seconds 
                        ? new Date(tournament.endDate.seconds * 1000) 
                        : null;
                    
                    const startDateStr = startDate ? formatDate(startDate) : null;
                    const endDateStr = endDate ? formatDate(endDate) : null;
                    
                    const isLive = tournament.status === 'live';
                    const isUpcoming = tournament.status === 'upcoming';
                    const isCompleted = tournament.status === 'completed';

                    return (
                        <Card 
                            key={tournament.id} 
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                                isLive ? 'border-primary border-2 ring-2 ring-primary/20' : ''
                            }`}
                        >
                            {isLive && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                                    LIVE
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2 flex items-center gap-2">
                                            <Trophy className={`w-5 h-5 ${isLive ? 'text-primary' : 'text-muted-foreground'}`} />
                                            {tournament.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant={isLive ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                                                {tournament.format}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {tournament.teams?.length || 0} teams
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {tournament.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {tournament.description}
                                    </p>
                                )}
                                
                                <div className="space-y-2 text-sm">
                                    {isClient && startDateStr && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {startDateStr} 
                                                {endDateStr && ` - ${endDateStr}`}
                                            </span>
                                        </div>
                                    )}
                                    {!isClient && startDate && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    )}
                                    {tournament.venue && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="text-xs">📍 {tournament.venue}</span>
                                        </div>
                                    )}
                                </div>

                                {tournament.prizePool && (
                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                        <p className="text-xs text-muted-foreground mb-1">Sponsored Rewards Pool</p>
                                        <p className="text-lg font-bold text-primary">{tournament.prizePool}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="text-xs text-muted-foreground">
                                        {tournament.entryFee?.type === 'free' ? (
                                            <span className="text-green-600 font-semibold">Free Entry</span>
                                        ) : (
                                            <span>Entry: ₹{tournament.entryFee?.amount || 'Paid'}</span>
                                        )}
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant={isLive ? 'default' : isUpcoming ? 'outline' : 'ghost'}
                                        asChild
                                        className={isCompleted ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                        <Link href={`/fantasy/cricket/tournament/${tournament.id}`}>
                                            {isLive ? 'Join Live' : isUpcoming ? 'View Details' : 'View Results'}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function MatchList({ matches, isLoading }: { matches: FantasyMatchWithId[] | null, isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!matches || matches.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                    No matches available in this category.
                </CardContent>
            </Card>
        )
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="flex flex-col">
              <CardHeader>
                <div className='flex justify-between items-center'>
                    <CardTitle className="font-headline text-2xl">{match.matchName}</CardTitle>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${match.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-secondary'}`}>{match.status}</span>
                </div>
                <CardDescription>
                  {match.format}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-2 text-primary">
                    <Ticket className="w-5 h-5"/>
                    <span className="font-semibold">Sponsored Rewards Active</span>
                </div>
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full" disabled={match.status !== 'live'}>
                    <Link href={`/fantasy/cricket/match/${match.id}`}>
                        {match.status === 'live' ? 'Enter Live Match' : 'Match Opens Soon'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
    )
}

function CricketFantasyContent() {
    const firestore = useFirestore();
    const matchesQuery = firestore ? collection(firestore, 'fantasy_matches') : null;
    const { data: matchesData, isLoading } = useCollection(matchesQuery);
    
    const allMatches = matchesData as FantasyMatchWithId[] | undefined;

    const filterMatches = (format: string | null) => {
        if (!allMatches) return [];
        if (!format) return allMatches;
        if (format === 'T20') {
            // Include both standard T20 and IPL which is a T20 format
            return allMatches.filter(m => m.format === 'T20' || m.matchName.toLowerCase().includes('ipl'));
        }
        return allMatches.filter(m => m.format === format);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold md:text-4xl font-headline">
                Cricket Fantasy
                </h1>
                <p className="mt-2 text-muted-foreground">
                Play the new inning-wise, role-based fantasy game.
                </p>
            </div>

            <Tabs defaultValue="series" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 md:gap-2">
                <TabsTrigger value="series" className="text-xs sm:text-sm">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Series
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">All Matches</TabsTrigger>
                <TabsTrigger value="t20" className="text-xs sm:text-sm">T20 / IPL</TabsTrigger>
                <TabsTrigger value="odi" className="text-xs sm:text-sm">ODI</TabsTrigger>
                <TabsTrigger value="test" className="text-xs sm:text-sm">Test</TabsTrigger>
                </TabsList>
                <TabsContent value="series" className="mt-6">
                    <SeriesTab />
                </TabsContent>
                <TabsContent value="all" className="mt-6">
                    <MatchList matches={allMatches ? filterMatches(null) : null} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="t20" className="mt-6">
                    <MatchList matches={allMatches ? filterMatches('T20') : null} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="odi" className="mt-6">
                    <MatchList matches={allMatches ? filterMatches('ODI') : null} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="test" className="mt-6">
                    <MatchList matches={allMatches ? filterMatches('Test') : null} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
            
            <Card className="text-center bg-transparent border-dashed">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">A Game of Skill</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground max-w-3xl mx-auto space-y-2">
                    <p>This is a skill-based cricket strategy and prediction game. Outcomes depend on the user’s knowledge, analysis, and timing. There is no element of chance or randomness.</p>
                </CardContent>
                <CardFooter className='flex-col gap-2'>
                    <p className="text-xs text-muted-foreground/50">
                        This game is open only to users aged 18 years and above.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function CricketFantasyPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
    const { data: userProfile, isLoading } = useDoc(userProfileRef);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useEffect(() => {
        if (!isLoading && userProfile) {
            if (!userProfile.ageVerified || !userProfile.fantasyEnabled) {
                setShowDisclaimer(true);
            }
        }
    }, [isLoading, userProfile]);

    if (isLoading) {
        return (
            <div className='space-y-8'>
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-8 w-3/4" />
                <div className='grid md:grid-cols-2 gap-6 mt-8'>
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (showDisclaimer) {
        return <DisclaimerModal />;
    }

    return <CricketFantasyContent />;
}
