'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getIPLMatchesDescending } from '@/firebase/firestore/ipl-matches';
import { adminResyncSelectionStatsFromIPLPicks } from '@/firebase/firestore/player-selection-stats';
import { processIPLMatchCompletion } from '@/firebase/firestore/ipl-match-completion';
import { IPL_TOURNAMENT_ID } from '@/lib/ipl-constants';
import { ArrowLeft, Percent, Zap } from 'lucide-react';

export default function AdminIPLScoringPage() {
  const firestore = useFirestore();
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getIPLMatchesDescending>>>([]);
  const [matchId, setMatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'pct' | 'score' | null>(null);

  useEffect(() => {
    if (!firestore) return;
    getIPLMatchesDescending(firestore).then((m) => {
      setMatches(m);
      if (m.length && !matchId) setMatchId(m[0].id);
      setLoading(false);
    });
  }, [firestore]);

  const runSelectionPct = async () => {
    if (!firestore || !matchId) return;
    setBusy('pct');
    try {
      const res = await adminResyncSelectionStatsFromIPLPicks(firestore, matchId, IPL_TOURNAMENT_ID);
      toast({
        title: 'Selection % updated',
        description: `Users with pick: ${res.totalUsers}, players counted: ${res.playerCount}`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description: e instanceof Error ? e.message : 'Error',
      });
    } finally {
      setBusy(null);
    }
  };

  const runScoring = async () => {
    if (!firestore || !matchId) return;
    setBusy('score');
    try {
      const { processedUsers, errors } = await processIPLMatchCompletion(
        firestore,
        matchId,
        IPL_TOURNAMENT_ID
      );
      if (errors.length) {
        console.warn('IPL scoring warnings', errors);
      }
      toast({
        title: 'Scoring completed',
        description: `Updated ${processedUsers} user(s). ${errors.length ? `${errors.length} warning(s) in console.` : ''}`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Scoring failed',
        description: e instanceof Error ? e.message : 'Error',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/fantasy/ipl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            IPL Admin
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Scoring & selection %</h1>
        <p className="text-sm text-muted-foreground">
          Tournament: <code className="text-xs bg-muted px-1 rounded">{IPL_TOURNAMENT_ID}</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select match</CardTitle>
          <CardDescription>Choose the fixture to resync selection stats or run scoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches. Create one first.</p>
          ) : (
            <Select value={matchId} onValueChange={setMatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Match" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.teamA} vs {m.teamB} · {m.status} · {m.id.slice(0, 8)}…
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="space-y-2 pt-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              disabled={!matchId || busy !== null}
              onClick={runSelectionPct}
            >
              <Percent className="w-4 h-4 mr-2" />
              {busy === 'pct' ? 'Working…' : 'Calculate selection %'}
            </Button>
            <p className="text-xs text-muted-foreground pl-1">
              Rebuilds <code>player_selection_stats</code> from locked picks for this match.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Button
              className="w-full justify-start"
              disabled={!matchId || busy !== null}
              onClick={runScoring}
            >
              <Zap className="w-4 h-4 mr-2" />
              {busy === 'score' ? 'Scoring…' : 'Run match scoring'}
            </Button>
            <p className="text-xs text-muted-foreground pl-1">
              Idempotent: re-run updates the same history entry per user. Ensure stats and selection % are set first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
