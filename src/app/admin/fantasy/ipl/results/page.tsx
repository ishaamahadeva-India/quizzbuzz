'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getIPLUserPicksByTournament } from '@/firebase/firestore/ipl-user-picks';
import { getIPLMatchesDescending } from '@/firebase/firestore/ipl-matches';
import { IPL_TOURNAMENT_ID } from '@/lib/ipl-constants';
import type { IPLUserPickHistoryEntry } from '@/lib/types';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function AdminIPLResultsPage() {
  const firestore = useFirestore();
  const [picks, setPicks] = useState<Awaited<ReturnType<typeof getIPLUserPicksByTournament>>>([]);
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getIPLMatchesDescending>>>([]);
  const [filterMatchId, setFilterMatchId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [openUser, setOpenUser] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) return;
    (async () => {
      setLoading(true);
      try {
        const [p, m] = await Promise.all([
          getIPLUserPicksByTournament(firestore, IPL_TOURNAMENT_ID),
          getIPLMatchesDescending(firestore),
        ]);
        setPicks(p);
        setMatches(m);
      } finally {
        setLoading(false);
      }
    })();
  }, [firestore]);

  const sorted = useMemo(
    () => [...picks].sort((a, b) => b.totalPoints - a.totalPoints),
    [picks]
  );

  const historyForFilter = (h: IPLUserPickHistoryEntry[]) => {
    if (filterMatchId === 'all') return h;
    return h.filter((e) => e.matchId === filterMatchId);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/fantasy/ipl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            IPL Admin
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Results & history</h1>
        <p className="text-sm text-muted-foreground">Leaderboard and per-user match breakdown.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by match</CardTitle>
          <CardDescription>Show only history rows for one match (optional).</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={filterMatchId} onValueChange={setFilterMatchId}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All matches</SelectItem>
              {matches.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.teamA} vs {m.teamB}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard ({sorted.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-2">
              {sorted.map((pick, i) => {
                const hist = historyForFilter(pick.history ?? []);
                const isOpen = openUser === pick.id;
                return (
                  <Collapsible key={pick.id} open={isOpen} onOpenChange={(o) => setOpenUser(o ? pick.id! : null)}>
                    <div className="rounded-lg border bg-card">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50"
                        >
                          <span className="flex items-center gap-2">
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="font-mono text-sm">#{i + 1}</span>
                            <span className="font-mono text-xs text-muted-foreground">{pick.userId.slice(0, 12)}…</span>
                          </span>
                          <span className="font-bold">{pick.totalPoints} pts</span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t px-3 pb-3 text-xs">
                          {hist.length === 0 ? (
                            <p className="text-muted-foreground py-2">No history rows for this filter.</p>
                          ) : (
                            <table className="w-full mt-2">
                              <thead>
                                <tr className="text-muted-foreground text-left">
                                  <th className="pb-1">matchId</th>
                                  <th className="pb-1">total</th>
                                  <th className="pb-1">bat</th>
                                  <th className="pb-1">bowl</th>
                                  <th className="pb-1">AR</th>
                                  <th className="pb-1">cap</th>
                                  <th className="pb-1">em</th>
                                  <th className="pb-1">mult</th>
                                  <th className="pb-1">pen</th>
                                </tr>
                              </thead>
                              <tbody>
                                {hist.map((e) => (
                                  <tr key={e.matchId} className="border-t border-border/40">
                                    <td className="py-1 font-mono">{e.matchId.slice(0, 8)}…</td>
                                    <td>{e.totalMatchPoints ?? e.finalPoints ?? '—'}</td>
                                    <td>{e.batsmanPoints ?? '—'}</td>
                                    <td>{e.bowlerPoints ?? '—'}</td>
                                    <td>{e.allRounderPoints ?? '—'}</td>
                                    <td>{e.captainPoints ?? '—'}</td>
                                    <td>{e.emergingPoints ?? '—'}</td>
                                    <td>{e.multiplier ?? '—'}</td>
                                    <td>{e.switchPenalty ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
