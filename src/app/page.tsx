
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, limit, type Query, doc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useEffect, useState } from 'react';
import type { Article, UserProfile, Movie, Gossip, Advertisement } from '@/lib/types';
import { MessageSquareText } from 'lucide-react';
import { SocialShare } from '@/components/social-share';

// Helper function to convert various date types to Date
function toDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (dateValue instanceof Timestamp) return dateValue.toDate();
    if (dateValue && typeof dateValue.toDate === 'function') return dateValue.toDate();
    if (typeof dateValue === 'number') return new Date(dateValue);
    if (typeof dateValue === 'string') return new Date(dateValue);
    return null;
}


function AdBanner() {
    const firestore = useFirestore();
    
    // Query for active advertisements in the between-articles position
    const adsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'advertisements'),
            where('position', '==', 'home-article-between'),
            where('active', '==', true)
        );
    }, [firestore]);
    
    const { data: ads } = useCollection(adsQuery);
    
    // Get the first active ad
    const advertisement = useMemo(() => {
        if (!ads || ads.length === 0) return null;
        const sortedAds = [...ads].sort((a, b) => {
            const dateA = toDate(a.createdAt);
            const dateB = toDate(b.createdAt);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB.getTime() - dateA.getTime();
        });
        return sortedAds[0] as Advertisement & { id: string };
    }, [ads]);
    
    // Check if ad is within date range
    if (advertisement) {
        const now = new Date();
        const startDate = toDate(advertisement.startDate);
        const endDate = toDate(advertisement.endDate);
        
        if (startDate && now < startDate) return null;
        if (endDate && now > endDate) return null;
    }
    
    if (!advertisement) {
        return (
            <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/20 my-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2 text-center">
                        <p className="font-semibold text-sm text-foreground">
                            Sponsored Content by <span className="text-primary font-bold">Our Partners</span>
                        </p>
                        <Button asChild size="sm" variant='outline' className="sm:ml-auto shrink-0">
                            <Link href="#" target="_blank">Learn More</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/20 my-6">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-center sm:text-left">
                        <p className="font-semibold text-sm text-foreground mb-1">
                            {advertisement.title}
                        </p>
                        {advertisement.description && (
                            <p className="text-xs text-muted-foreground">
                                {advertisement.description}
                            </p>
                        )}
                    </div>
                    {advertisement.imageUrl && (
                        <div className="relative w-full sm:w-32 aspect-[4/1] sm:aspect-[4/1] rounded-md overflow-hidden shrink-0 bg-muted">
                            <Image
                                src={advertisement.imageUrl}
                                alt={advertisement.title}
                                fill
                                className="object-contain"
                                sizes="(max-width: 640px) 100vw, 128px"
                                unoptimized
                            />
                        </div>
                    )}
                    <Button asChild size="sm" variant='outline' className="shrink-0">
                        <Link href={advertisement.linkUrl} target="_blank" rel="noopener noreferrer">
                            Learn More
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function GossipList() {
    const firestore = useFirestore();
    const gossipsQuery = firestore ? query(
        collection(firestore, 'gossips'),
        limit(10)
    ) : null;
    const { data: gossips, isLoading, error } = useCollection(gossipsQuery);
    
    // Reverse to show newest first (Firestore returns in creation order)
    const sortedGossips = gossips ? [...gossips].reverse() : null;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="font-headline text-2xl">Gossip Mill</CardTitle>
                        <Skeleton className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-32" />
                     </div>
                   ))}
                </CardContent>
            </Card>
        );
    }
    
    if (error) {
        console.error('Error loading gossips:', error);
    }
    
    if (!sortedGossips || sortedGossips.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Gossip Mill</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <MessageSquareText className="w-12 h-12 mx-auto mb-2" />
                        <p>No gossip yet. Check back later!</p>
                        {error && (
                            <p className="text-xs text-destructive mt-2">Error loading gossips</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Get the first gossip URL for sharing the section
    const firstGossipUrl = sortedGossips.length > 0 && typeof window !== 'undefined' 
        ? `${window.location.origin}/gossip/${sortedGossips[0].id}` 
        : '';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <CardTitle className="font-headline text-2xl">Gossip Mill</CardTitle>
                    {firstGossipUrl && (
                        <SocialShare
                            url={firstGossipUrl}
                            title="Gossip Mill"
                            description="Latest gossip and rumors"
                            variant="ghost"
                            size="sm"
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {sortedGossips.map((gossip, index) => {
                        return (
                            <li key={gossip.id} className="space-y-2">
                                <p className="font-medium text-base leading-snug line-clamp-2">
                                    {gossip.title}
                                </p>
                                <p className="text-sm text-muted-foreground">Source: {gossip.source}</p>
                                {index < sortedGossips.length - 1 && <Separator className="mt-4" />}
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    )
}

function SponsoredAd() {
    const firestore = useFirestore();
    
    // Query for active advertisements in the sidebar sponsored position
    // Note: Removed orderBy to avoid index requirement - we'll sort client-side
    const adsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'advertisements'),
            where('position', '==', 'home-sidebar-sponsored'),
            where('active', '==', true)
        );
    }, [firestore]);
    
    const { data: ads, isLoading, error } = useCollection(adsQuery);
    
    // Debug logging (client-side only, in development)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            if (error) {
                console.error('Error fetching advertisements:', error);
            }
            if (ads) {
                console.log('Fetched advertisements:', ads);
                console.log('Advertisements count:', ads.length);
                ads.forEach((ad, idx) => {
                    console.log(`Ad ${idx + 1}:`, {
                        id: ad.id,
                        title: ad.title,
                        position: ad.position,
                        active: ad.active,
                        createdAt: ad.createdAt
                    });
                });
            }
        }
    }, [ads, error]);
    
    // Sort by createdAt descending client-side and get the first one
    const advertisement = useMemo(() => {
        if (!ads || ads.length === 0) return null;
        
        const sortedAds = [...ads].sort((a, b) => {
            const dateA = toDate(a.createdAt);
            const dateB = toDate(b.createdAt);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB.getTime() - dateA.getTime();
        });
        
        return sortedAds[0] as Advertisement & { id: string };
    }, [ads]);
    
    if (isLoading) {
        return (
            <Card className="bg-gradient-to-br from-accent/10">
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
        );
    }
    
    if (error) {
        console.error('Error loading advertisement:', error);
        return null; // Don't show error to users, just fail silently
    }
    
    if (!advertisement) {
        if (process.env.NODE_ENV === 'development') {
            console.log('No active advertisement found for home-sidebar-sponsored position');
        }
        return null; // Don't show anything if no active ad
    }
    
    // Check if ad is within date range (if dates are set)
    // Use useState and useEffect to avoid hydration mismatches
    const [isDateValid, setIsDateValid] = useState<boolean | null>(null);
    
    useEffect(() => {
        const now = new Date();
        const startDate = toDate(advertisement.startDate);
        const endDate = toDate(advertisement.endDate);
        
        // Debug logging (client-side only)
        if (process.env.NODE_ENV === 'development') {
            console.log('Advertisement date check:', {
                title: advertisement.title,
                startDate,
                endDate,
                now,
                startDateValid: startDate ? now >= startDate : true,
                endDateValid: endDate ? now <= endDate : true
            });
        }
        
        if (startDate && now < startDate) {
            if (process.env.NODE_ENV === 'development') {
                console.log('Advertisement filtered out: Hasn\'t started yet');
            }
            setIsDateValid(false);
            return;
        }
        if (endDate && now > endDate) {
            if (process.env.NODE_ENV === 'development') {
                console.log('Advertisement filtered out: Has expired');
            }
            setIsDateValid(false);
            return;
        }
        
        setIsDateValid(true);
        if (process.env.NODE_ENV === 'development') {
            console.log('Rendering advertisement:', advertisement.title);
        }
    }, [advertisement]);
    
    // Don't render until date check is complete (prevents hydration mismatch)
    if (isDateValid === null) {
        return null; // Still checking dates
    }
    
    if (isDateValid === false) {
        return null; // Ad is outside date range
    }
    
    return (
        <Card className="bg-gradient-to-br from-accent/10">
            <CardHeader>
                <CardTitle className="font-headline">Sponsored</CardTitle>
                {advertisement.description && (
                    <CardDescription>{advertisement.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="text-center">
                {advertisement.imageUrl && (
                    <div className="relative w-full aspect-[3/2] mb-4 rounded-md overflow-hidden bg-muted">
                        <Image
                            src={advertisement.imageUrl}
                            alt={advertisement.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 300px"
                            unoptimized
                        />
                    </div>
                )}
                <p className="font-bold text-lg">{advertisement.title}</p>
                {advertisement.description && !advertisement.imageUrl && (
                    <p className="text-sm text-muted-foreground mt-1">{advertisement.description}</p>
                )}
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={advertisement.linkUrl} target="_blank" rel="noopener noreferrer">
                        Learn More
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function WatchlistSidebar() {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
    const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

    const watchlistIds = useMemo(() => userProfile?.watchlist || [], [userProfile]);

    const moviesQuery = useMemo(() => {
        if (!firestore || watchlistIds.length === 0) return null;
        return query(collection(firestore, 'movies'), where('__name__', 'in', watchlistIds));
    }, [firestore, watchlistIds]);

    const { data: movies, isLoading: moviesLoading } = useCollection(moviesQuery);
    
    // All hooks must be called before any conditional returns
    // Early returns AFTER all hooks
    // Only show watchlist if user is logged in
    if (!user) {
        return null;
    }

    if (profileLoading) {
        return <Card><CardHeader><Skeleton className="h-8 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">My Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
                {moviesLoading && <Skeleton className="h-24 w-full" />}
                {!moviesLoading && (!movies || movies.length === 0) && (
                    <p className="text-muted-foreground text-sm">You haven't added any movies to your watchlist yet.</p>
                )}
                <ul className="space-y-4">
                    {movies?.map((movie) => (
                        <li key={movie.id}>
                            <Link href={`/fan-zone/movie/${movie.id}`} className="flex items-center gap-4 group">
                                <div className="relative w-12 h-16 shrink-0">
                                    <Image src={movie.posterUrl || `https://picsum.photos/seed/${movie.id}/200/300`} alt={movie.title} fill sizes="48px" className="object-cover rounded-sm" />
                                </div>
                                <div>
                                    <p className="font-semibold group-hover:text-primary">{movie.title}</p>
                                    <p className="text-xs text-muted-foreground">{movie.releaseYear}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

type ArticleWithId = Article & { id: string; };

function ArticleList({ category }: { category: string }) {
    const firestore = useFirestore();

    const articlesQuery = useMemo(() => {
        if (!firestore) return null;
        const articlesCollection = collection(firestore, 'articles');
        if (category.toLowerCase() === 'latest') {
            return query(articlesCollection);
        }
        // Use case-insensitive matching by querying and filtering
        // Note: Firestore queries are case-sensitive, so we need to handle this
        return query(articlesCollection, where('category', '==', category));
    }, [firestore, category]);

    const { data: articles, isLoading } = useCollection(articlesQuery);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                {[...Array(3)].map((_, index) => (
                    <div key={index}>
                        <div className="flex items-start gap-4">
                            <Skeleton className="w-24 h-24 shrink-0" />
                            <div className="flex-grow space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        </div>
                        <Separator className="mt-6" />
                    </div>
                ))}
            </div>
        )
    }

    if (articles === null || articles.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          No articles found in this category yet.
        </div>
      );
    }
    
    return (
      <div className="flex flex-col">
        {articles.map((article, index) => {
          const showAd = (index + 1) % 2 === 0;
          return (
            <div key={article.id}>
              <div className="group block py-6">
                <Link href={`/article/${article.slug}`} className="block">
                  <div className="flex items-start gap-4">
                    <div className="relative w-24 h-24 shrink-0">
                      <Image
                        src={`https://picsum.photos/seed/${article.id}/150/150`}
                        alt={article.title}
                        fill
                        className="object-cover rounded-md"
                        data-ai-hint="news article"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold leading-snug transition-colors duration-300 font-headline group-hover:text-primary">
                        {article.title}
                      </h3>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span>
                          Published on{' '}
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="mt-2 flex justify-end">
                  <SocialShare
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/article/${article.slug}`}
                    title={article.title}
                    description={article.excerpt}
                    imageUrl={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/600`}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </div>
              {showAd && <AdBanner />}
              {!showAd && index < articles.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    );
  };

export default function HomePage() {
  const categories = ['Cricket', 'Movies', 'Reviews', 'Gallery', 'Opinion'];
  
  return (
    <div className="space-y-8">
      {/* Mobile: Show sponsored content and gossips at top */}
      <div className="lg:hidden space-y-6">
        <GossipList />
        <SponsoredAd />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl font-headline">
              quizzbuzz
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your source for the latest news and analysis.
            </p>
          </div>

          <Tabs defaultValue="latest" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 sm:grid-cols-6">
              <TabsTrigger value="latest">Latest</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="latest">
              <ArticleList category="latest" />
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <ArticleList category={category} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Desktop: Show sidebar content */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8">
          <WatchlistSidebar />
          <GossipList />
          <SponsoredAd />
        </aside>
      </div>

      {/* Mobile: Show watchlist at bottom if user is logged in */}
      <div className="lg:hidden">
        <WatchlistSidebar />
      </div>
    </div>
  );
}
