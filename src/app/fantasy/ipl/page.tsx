'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { getUpcomingIPLMatch } from '@/firebase/firestore/ipl-matches';

const TOURNAMENT_ID = 'ipl_2026';

export default function IPLFantasyHubPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [match, setMatch] = useState<Awaited<ReturnType<typeof getUpcomingIPLMatch>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    getUpcomingIPLMatch(firestore).then(setMatch).finally(() => setLoading(false));
  }, [firestore]);

  const matchStartTime = match?.matchStartTime && 'seconds' in match.matchStartTime
    ? new Date(match.matchStartTime.seconds * 1000)
    : null;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">IPL Fantasy</h1>
        <p className="text-muted-foreground mt-1">
          Build a multi-role team per match (batsman required; bowler, all-rounder, captain, emerging optional).
          Underrated multipliers apply to your batsman. Points combine across all roles.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : match ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Upcoming Match
            </CardTitle>
            <CardDescription>
              {match.teamA} vs {match.teamB}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {matchStartTime && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>{matchStartTime.toLocaleString()}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Lock your team 30 minutes before match start. Underrated batsman picks (&lt;10% selection) get 2x–3x on batting points.
            </p>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                router.push(`/fantasy/ipl/match/${match.id}`);
              }}
            >
              Select team
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">No upcoming match</p>
            <p className="text-sm mt-2">Check back later for IPL 2026 fixtures.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" asChild>
          <Link href="/fantasy/ipl/leaderboard">
            <Users className="w-4 h-4 mr-2" />
            Leaderboard
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/fantasy">Back to Fantasy Hub</Link>
        </Button>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Pick batsman (required) plus optional bowler, all-rounder, captain, emerging before lock.</p>
          <p>• Batsman: runs, fours, sixes, milestones, strike rate + underrated multiplier.</p>
          <p>• Bowler: wickets &amp; economy; all-rounder: combined batting+bowling + bonus; captain: win + performance; emerging: 1.5× if flagged.</p>
          <p>• One free switch pool; after that, −20 points per role change.</p>
        </CardContent>
      </Card>
    </div>
  );
}
