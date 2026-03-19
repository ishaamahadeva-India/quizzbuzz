'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, ArrowLeft } from 'lucide-react';
import { subscribeIPLLeaderboard, getIPLUserPicksByTournament } from '@/firebase/firestore/ipl-user-picks';

const TOURNAMENT_ID = 'ipl_2026';

export default function IPLLeaderboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [picks, setPicks] = useState<Awaited<ReturnType<typeof getIPLUserPicksByTournament>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const unsub = subscribeIPLLeaderboard(firestore, TOURNAMENT_ID, (data) => {
      setPicks(data);
      setLoading(false);
    });
    return () => unsub();
  }, [firestore]);

  const sorted = [...picks].sort((a, b) => b.totalPoints - a.totalPoints);
  const ranked = sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  const currentUserRank = user ? ranked.find((r) => r.userId === user.uid) : null;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fantasy/ipl">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">IPL Fantasy Leaderboard</h1>
          <p className="text-muted-foreground text-sm">Sorted by total points</p>
        </div>
      </div>

      {currentUserRank && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your rank</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary">#{currentUserRank.rank}</span>
            <span className="text-xl font-semibold">{currentUserRank.totalPoints} pts</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ranked.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No entries yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {ranked.map((r) => {
                const isCurrentUser = user && r.userId === user.uid;
                const icon =
                  r.rank === 1 ? (
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  ) : r.rank === 2 ? (
                    <Medal className="w-5 h-5 text-gray-400" />
                  ) : r.rank === 3 ? (
                    <Medal className="w-5 h-5 text-amber-600" />
                  ) : (
                    <span className="text-muted-foreground font-medium w-6 text-center">#{r.rank}</span>
                  );
                return (
                  <li
                    key={r.id}
                    className={`flex items-center justify-between py-3 px-2 rounded-lg ${
                      isCurrentUser ? 'bg-primary/10 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {icon}
                      <span className="font-mono text-sm text-muted-foreground">
                        {r.userId.slice(0, 8)}...
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <span className="font-bold">{r.totalPoints}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link href="/fantasy/ipl">Back to IPL Fantasy</Link>
      </Button>
    </div>
  );
}
