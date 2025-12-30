
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import type { UserProfile, FantasyCampaign, Movie } from '@/lib/types';
import { doc, collection, query, where, or, orderBy, Timestamp } from 'firebase/firestore';
import { DisclaimerModal } from '@/components/fantasy/disclaimer-modal';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type FantasyCampaignWithId = FantasyCampaign & { id: string };
type MovieWithId = Movie & { id: string };

function MovieFantasyContent({ 
    campaigns, 
    isLoading, 
    movies 
}: { 
    campaigns: FantasyCampaignWithId[] | undefined; 
    isLoading: boolean;
    movies: MovieWithId[] | undefined;
}) {
    if (isLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-6 w-3/4 mt-2" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!campaigns || campaigns.length === 0) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold md:text-4xl font-headline">
                        Fantasy Movie League
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Predict the entire lifecycle of a movie, from announcement to box office glory.
                    </p>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold font-headline">Active Campaigns</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                                No active movie campaigns at the moment. Check back soon!
                            </p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">How to Play</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>1. Select an active movie campaign.</p>
                        <p>2. Participate in prediction events throughout the movie's lifecycle (teasers, trailers, box office).</p>
                        <p>3. Accumulate points for each correct prediction and climb the leaderboard!</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getMovieTitles = (campaign: FantasyCampaignWithId): string[] => {
        if (campaign.campaignType === 'single_movie' && campaign.movieTitle) {
            return [campaign.movieTitle];
        }
        if (campaign.campaignType === 'multiple_movies' && campaign.movies && campaign.movies.length > 0) {
            // Fetch movie titles from the movies array
            return campaign.movies.map((m) => {
                if (m.movieTitle) {
                    return m.movieTitle;
                }
                // Try to find movie in the movies collection
                if (m.movieId && movies) {
                    const movie = movies.find((mov) => mov.id === m.movieId);
                    if (movie) {
                        return `${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ''}`;
                    }
                }
                return 'Unknown Movie';
            });
        }
        return ['Movie Campaign'];
    };

    const getEventCount = (campaign: FantasyCampaignWithId): number => {
        return campaign.events?.length || 0;
    };

    const getStatusDisplay = (status: string): string => {
        switch (status) {
            case 'upcoming':
                return 'Upcoming';
            case 'active':
                return 'Active';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold md:text-4xl font-headline">
                    Fantasy Movie League
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Predict the entire lifecycle of a movie, from announcement to box office glory.
                </p>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold font-headline">Active Campaigns</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaigns.map((campaign) => {
                        const movieTitles = getMovieTitles(campaign);
                        const eventCount = getEventCount(campaign);
                        const statusDisplay = getStatusDisplay(campaign.status);
                        
                        return (
                            <Card key={campaign.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl">{campaign.title}</CardTitle>
                                    <CardDescription>
                                        Status: {statusDisplay} | {eventCount} Prediction Events
                                        {movieTitles.length > 0 && (
                                            <span className="block mt-1">
                                                {movieTitles.length === 1 
                                                    ? movieTitles[0]
                                                    : `${movieTitles.length} Movies`
                                                }
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {(campaign.prizePool || campaign.prizeDistribution) && (
                                        <div className="flex items-center gap-2">
                                            <Ticket className="w-5 h-5 text-primary"/>
                                            {campaign.prizeDistribution ? (
                                                <Link 
                                                    href={`/fantasy/campaign/${campaign.id}/prizes`}
                                                    className="font-semibold text-primary hover:underline cursor-pointer"
                                                >
                                                    View Prize Distribution
                                                </Link>
                                            ) : (
                                                <span className="font-semibold text-primary">{campaign.prizePool}</span>
                                            )}
                                        </div>
                                    )}
                                    {campaign.description && (
                                        <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                                            {campaign.description}
                                        </p>
                                    )}
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        This is a skill-based fantasy prediction game. No element of chance.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/fantasy/campaign/${campaign.id}`}>
                                            View Campaign <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>
            
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="font-headline">How to Play</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>1. Select an active movie campaign.</p>
                    <p>2. Participate in prediction events throughout the movie's lifecycle (teasers, trailers, box office).</p>
                    <p>3. Accumulate points for each correct prediction and climb the leaderboard!</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function MovieFantasyPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
    const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // Query for movie campaigns (single_movie or multiple_movies)
    // We'll filter by status client-side since Firestore doesn't support nested or() queries easily
    // Note: Removed orderBy temporarily to avoid index requirement - we'll sort client-side
    const campaignsQuery = useMemo(() => {
        if (!firestore) return null;
        const campaignsRef = collection(firestore, 'fantasy-campaigns');
        // Try to use or() query, but if it fails, we'll fetch all and filter client-side
        return query(
            campaignsRef,
            or(
                where('campaignType', '==', 'single_movie'),
                where('campaignType', '==', 'multiple_movies')
            )
        );
    }, [firestore]);

    // Fallback query: fetch all campaigns if the filtered query fails
    const fallbackQuery = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, 'fantasy-campaigns');
    }, [firestore]);

    const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError } = useCollection(campaignsQuery);
    const { data: fallbackData } = useCollection(campaignsError ? fallbackQuery : null);
    
    // Use fallback data if main query failed
    const finalCampaignsData = campaignsError && fallbackData ? fallbackData : campaignsData;
    
    // Fetch all movies for displaying movie titles
    const moviesQuery = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, 'movies');
    }, [firestore]);
    
    const { data: moviesData } = useCollection(moviesQuery);
    const movies = moviesData as MovieWithId[] | undefined;
    
    // Debug logging
    useEffect(() => {
        if (campaignsError) {
            console.error('Error fetching campaigns:', campaignsError);
            console.log('Using fallback query to fetch all campaigns...');
        }
        if (finalCampaignsData) {
            console.log('Fetched campaigns:', finalCampaignsData);
            console.log('Campaigns count:', finalCampaignsData.length);
            (finalCampaignsData as FantasyCampaignWithId[]).forEach((campaign, idx) => {
                console.log(`Campaign ${idx + 1}:`, {
                    id: campaign.id,
                    title: campaign.title,
                    campaignType: campaign.campaignType,
                    status: campaign.status,
                    visibility: campaign.visibility,
                    startDate: campaign.startDate
                });
            });
        }
    }, [finalCampaignsData, campaignsError]);
    
    // Filter campaigns client-side to only show upcoming or active ones, and public visibility
    // Also filter by campaignType and sort by startDate
    const campaigns = useMemo(() => {
        if (!finalCampaignsData) return undefined;
        const allCampaigns = finalCampaignsData as FantasyCampaignWithId[];
        console.log('All campaigns before filter:', allCampaigns.length);
        
        // First filter by campaignType (in case query didn't work)
        const movieCampaigns = allCampaigns.filter(campaign => 
            campaign.campaignType === 'single_movie' || campaign.campaignType === 'multiple_movies'
        );
        console.log('Movie campaigns after type filter:', movieCampaigns.length);
        
        // Then filter by status and visibility
        const filtered = movieCampaigns.filter(campaign => {
            const statusMatch = campaign.status === 'upcoming' || campaign.status === 'active';
            const visibilityMatch = campaign.visibility === 'public' || !campaign.visibility;
            const result = statusMatch && visibilityMatch;
            
            if (!result) {
                console.log('Campaign filtered out:', {
                    title: campaign.title,
                    campaignType: campaign.campaignType,
                    status: campaign.status,
                    visibility: campaign.visibility,
                    statusMatch,
                    visibilityMatch
                });
            }
            
            return result;
        });
        
        // Sort by startDate descending (client-side)
        filtered.sort((a, b) => {
            // Handle different date types: Date, Firestore Timestamp, or number
            const getDateValue = (date: any): number => {
                if (date instanceof Date) {
                    return date.getTime();
                }
                if (date instanceof Timestamp) {
                    return date.toMillis();
                }
                if (date && typeof date.toMillis === 'function') {
                    return date.toMillis();
                }
                if (typeof date === 'number') {
                    return date;
                }
                return 0;
            };
            
            const dateA = getDateValue(a.startDate);
            const dateB = getDateValue(b.startDate);
            return dateB - dateA;
        });
        
        console.log('Filtered campaigns:', filtered.length);
        return filtered;
    }, [finalCampaignsData]);

    useEffect(() => {
        if (!profileLoading && userProfile) {
            if (!userProfile.ageVerified || !userProfile.fantasyEnabled) {
                setShowDisclaimer(true);
            }
        }
    }, [profileLoading, userProfile]);

    if (profileLoading) {
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
        return <DisclaimerModal onClose={() => setShowDisclaimer(false)} />;
    }

    return <MovieFantasyContent campaigns={campaigns} isLoading={campaignsLoading} movies={movies} />;
}
