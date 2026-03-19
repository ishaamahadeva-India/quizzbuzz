'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Film, Shield, Trophy } from 'lucide-react';
import Link from 'next/link';
import { FantasyOnboarding } from '@/components/fantasy/fantasy-onboarding';
import { Skeleton } from '@/components/ui/skeleton';

function FantasyHub() {
    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold md:text-6xl font-headline text-balance">
                Fantasy Arena
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Two worlds of skill-based fantasy. Choose your arena.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <Link href="/fantasy/ipl" className="group">
                    <Card className="flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ease-in-out h-full group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:border-primary/20">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Trophy className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold font-headline mt-4">IPL Fantasy</h2>
                        <ul className="mt-4 space-y-2 text-muted-foreground text-left list-disc list-inside">
                            <li>Pick a batsman per match</li>
                            <li>Multipliers for underrated picks</li>
                            <li>Real-time leaderboard</li>
                        </ul>
                        <Button asChild className="mt-8" variant="outline">
                            <div>Choose Game <ArrowRight className="w-4 h-4 ml-2" /></div>
                        </Button>
                    </Card>
                </Link>
                <Link href="/fantasy/cricket" className="group">
                    <Card className="flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ease-in-out h-full group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:border-primary/20">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Shield className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold font-headline mt-4">Cricket Live Fantasy</h2>
                        <ul className="mt-4 space-y-2 text-muted-foreground text-left list-disc list-inside">
                            <li>Live match decisions</li>
                            <li>Roles & predictions</li>
                            <li>Scores every few minutes</li>
                        </ul>
                        <Button asChild className="mt-8" variant="outline">
                            <div>Choose Game <ArrowRight className="w-4 h-4 ml-2" /></div>
                        </Button>
                    </Card>
                </Link>
                <Link href="/fantasy/movie" className="group">
                    <Card className="flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ease-in-out h-full group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:border-primary/20">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Film className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold font-headline mt-4">Movie Fantasy</h2>
                        <ul className="mt-4 space-y-2 text-muted-foreground text-left list-disc list-inside">
                            <li>Predict box office & star impact</li>
                            <li>Build fantasy lineups</li>
                            <li>Track rankings & buzz</li>
                        </ul>
                        <Button asChild className="mt-8" variant="outline">
                            <div>Choose Game <ArrowRight className="w-4 h-4 ml-2" /></div>
                        </Button>
                    </Card>
                </Link>
            </div>

            <Card className="text-center max-w-3xl mx-auto bg-transparent border-dashed">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Skill Comes First</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>No gambling. No random outcomes. Your performance depends on analysis and smart choices.</p>
                </CardContent>
                <CardFooter className='flex-col gap-2'>
                    <p className="text-xs text-muted-foreground/50">
                        This platform hosts skill-based fantasy games for sports and entertainment. No element of chance or gambling involved. 18+ only.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function FantasyPage() {
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

    useEffect(() => {
        const onboardingCompleted = localStorage.getItem('fantasyOnboardingCompleted');
        if (onboardingCompleted) {
            setShowOnboarding(false);
        } else {
            setShowOnboarding(true);
        }
    }, []);

    const handleOnboardingComplete = () => {
        localStorage.setItem('fantasyOnboardingCompleted', 'true');
        setShowOnboarding(false);
    };

    if (showOnboarding === null) {
        return (
            <div className="space-y-12">
                <div className="text-center">
                    <Skeleton className="h-16 w-3/4 mx-auto" />
                    <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    if (showOnboarding) {
        return <FantasyOnboarding onComplete={handleOnboardingComplete} />;
    }

    return <FantasyHub />;
}
