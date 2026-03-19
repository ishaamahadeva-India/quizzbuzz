'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getIPLMatch } from '@/firebase/firestore/ipl-matches';
import { getAllIPLPlayersForAdmin } from '@/firebase/firestore/ipl-players';
import { getStatsByMatch, upsertPlayerMatchStats } from '@/firebase/firestore/player-match-stats';
import { ArrowLeft } from 'lucide-react';

type Row = {
  playerId: string;
  name: string;
  team: string;
  runs: string;
  fours: string;
  sixes: string;
  strikeRate: string;
  wickets: string;
  economy: string;
  catches: string;
  isOut: boolean;
};

function emptyRow(p: { id: string; name: string; team: string }): Row {
  return {
    playerId: p.id,
    name: p.name,
    team: p.team,
    runs: '0',
    fours: '0',
    sixes: '0',
    strikeRate: '0',
    wickets: '0',
    economy: '0',
    catches: '0',
    isOut: false,
  };
}

function rowFromStat(
  p: { id: string; name: string; team: string },
  s: Awaited<ReturnType<typeof getStatsByMatch>>[0]
): Row {
  return {
    playerId: p.id,
    name: p.name,
    team: p.team,
    runs: String(s.runs),
    fours: String(s.fours),
    sixes: String(s.sixes),
    strikeRate: String(s.strikeRate),
    wickets: String(s.wickets),
    economy: String(s.economy ?? 0),
    catches: String(s.catches ?? 0),
    isOut: s.isOut,
  };
}

export default function AdminIPLMatchStatsPage() {
  const params = useParams();
  const matchId = params.id as string;
  const firestore = useFirestore();
  const [match, setMatch] = useState<Awaited<ReturnType<typeof getIPLMatch>>>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firestore || !matchId) return;
    (async () => {
      setLoading(true);
      try {
        const m = await getIPLMatch(firestore, matchId);
        setMatch(m);
        if (!m) {
          setRows([]);
          return;
        }
        const allPlayers = await getAllIPLPlayersForAdmin(firestore);
        const squad = allPlayers.filter((p) => p.team === m.teamA || p.team === m.teamB);
        const stats = await getStatsByMatch(firestore, matchId);
        const byPlayer = new Map(stats.map((s) => [s.playerId, s]));
        const nextRows: Row[] = squad.map((p) => {
          const s = byPlayer.get(p.id);
          return s ? rowFromStat(p, s) : emptyRow(p);
        });
        setRows(nextRows);
      } finally {
        setLoading(false);
      }
    })();
  }, [firestore, matchId]);

  const updateRow = (playerId: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.playerId === playerId ? { ...r, ...patch } : r)));
  };

  const saveOne = async (r: Row) => {
    if (!firestore) return;
    const num = (v: string) => Number.parseFloat(v) || 0;
    await upsertPlayerMatchStats(firestore, {
      matchId,
      playerId: r.playerId,
      runs: num(r.runs),
      fours: num(r.fours),
      sixes: num(r.sixes),
      strikeRate: num(r.strikeRate),
      wickets: num(r.wickets),
      isOut: r.isOut,
      economy: num(r.economy) || undefined,
      catches: num(r.catches) || undefined,
    });
  };

  const saveAll = async () => {
    if (!firestore) return;
    setSaving(true);
    try {
      for (const r of rows) {
        await saveOne(r);
      }
      toast({ title: 'All stats saved', description: `${rows.length} players` });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Error',
      });
    } finally {
      setSaving(false);
    }
  };

  const title = useMemo(() => {
    if (!match) return 'Match stats';
    return `${match.teamA} vs ${match.teamB}`;
  }, [match]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!match) {
    return (
      <div>
        <Button variant="ghost" asChild>
          <Link href="/admin/fantasy/ipl/matches">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <p className="mt-4 text-muted-foreground">Match not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/fantasy/ipl/matches">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Matches
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">player_match_stats · matchId: {matchId}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Player stats</CardTitle>
            <CardDescription>Runs, SR, wickets, economy, catches. Save row or bulk save.</CardDescription>
          </div>
          <Button onClick={saveAll} disabled={saving || rows.length === 0}>
            {saving ? 'Saving…' : 'Save all'}
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No players found for teams <strong>{match.teamA}</strong> / <strong>{match.teamB}</strong>. Add players with
              matching team codes.
            </p>
          ) : (
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-2">Player</th>
                  <th className="pb-2 pr-2">R</th>
                  <th className="pb-2 pr-2">4s</th>
                  <th className="pb-2 pr-2">6s</th>
                  <th className="pb-2 pr-2">SR</th>
                  <th className="pb-2 pr-2">W</th>
                  <th className="pb-2 pr-2">Eco</th>
                  <th className="pb-2 pr-2">Ct</th>
                  <th className="pb-2 pr-2">Out</th>
                  <th className="pb-2">Save</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.playerId} className="border-b border-border/50">
                    <td className="py-1 pr-2 font-medium whitespace-nowrap">
                      {r.name}
                      <span className="text-muted-foreground ml-1">({r.team})</span>
                    </td>
                    <td className="py-1 pr-1">
                      <Input
                        className="h-8 w-14"
                        value={r.runs}
                        onChange={(e) => updateRow(r.playerId, { runs: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-1">
                      <Input
                        className="h-8 w-12"
                        value={r.fours}
                        onChange={(e) => updateRow(r.playerId, { fours: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-1">
                      <Input
                        className="h-8 w-12"
                        value={r.sixes}
                        onChange={(e) => updateRow(r.playerId, { sixes: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-1">
                      <Input
                        className="h-8 w-14"
                        value={r.strikeRate}
                        onChange={(e) => updateRow(r.playerId, { strikeRate: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-1">
                      <Input
                        className="h-8 w-12"
                        value={r.wickets}
                        onChange={(e) => updateRow(r.playerId, { wickets: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-1">
                      <Input
                        className="h-8 w-12"
                        value={r.economy}
                        onChange={(e) => updateRow(r.playerId, { economy: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-1">
                      <Input
                        className="h-8 w-12"
                        value={r.catches}
                        onChange={(e) => updateRow(r.playerId, { catches: e.target.value })}
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <Switch checked={r.isOut} onCheckedChange={(v) => updateRow(r.playerId, { isOut: v })} />
                    </td>
                    <td className="py-1">
                      <Button size="sm" variant="secondary" type="button" onClick={() => saveOne(r).then(() => toast({ title: 'Saved', description: r.name }))}>
                        Save
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
