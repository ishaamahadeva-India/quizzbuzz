'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertTriangle, Zap, User, Target, Sparkles, Shield } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { getIPLMatch } from '@/firebase/firestore/ipl-matches';
import { getIPLPlayersByTeam } from '@/firebase/firestore/ipl-players';
import {
  getIPLUserPick,
  createIPLUserPick,
  updateIPLUserPickBatsman,
  updateIPLUserPickRole,
  clearIPLUserPickRole,
  lockIPLUserPickForMatch,
  getCurrentPlayerIdForRole,
  SWITCH_PENALTY_POINTS,
} from '@/firebase/firestore/ipl-user-picks';
import { getSelectionStatsForMatch } from '@/firebase/firestore/player-selection-stats';
import { getIPLUserPicksByTournament } from '@/firebase/firestore/ipl-user-picks';
import {
  incrementSelectionCount,
  decrementSelectionCount,
  updateSelectionPercentagesForMatch,
} from '@/firebase/firestore/player-selection-stats';
import { getMultiplierFromSelectionPercentage } from '@/lib/ipl-fantasy-engines';
import type { IPLTeamRole } from '@/lib/types';

const TOURNAMENT_ID = 'ipl_2026';
const LOCK_MINUTES_BEFORE = 30;

const ROLE_CONFIG: {
  key: IPLTeamRole;
  label: string;
  description: string;
  filterRole?: 'batsman' | 'bowler' | 'allrounder';
  icon: React.ReactNode;
}[] = [
  { key: 'batsman', label: 'Batsman', description: 'Runs, fours, sixes, strike rate', filterRole: 'batsman', icon: <User className="w-4 h-4" /> },
  { key: 'bowler', label: 'Bowler', description: 'Wickets, economy', filterRole: 'bowler', icon: <Target className="w-4 h-4" /> },
  { key: 'allRounder', label: 'All-Rounder', description: 'Batting + bowling + bonus', filterRole: 'allrounder', icon: <Zap className="w-4 h-4" /> },
  { key: 'captain', label: 'Captain', description: 'Win bonus + performance bonus', icon: <Shield className="w-4 h-4" /> },
  { key: 'emerging', label: 'Emerging Player', description: '1.5x if eligible', icon: <Sparkles className="w-4 h-4" /> },
];

type PlayerWithStats = {
  id: string;
  name: string;
  team: string;
  role: string;
  isEmerging?: boolean;
  selectionPercentage: number;
  multiplier: number;
};

export default function IPLMatchSelectPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const [match, setMatch] = useState<Awaited<ReturnType<typeof getIPLMatch>>>(null);
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [pick, setPick] = useState<Awaited<ReturnType<typeof getIPLUserPick>>>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedByRole, setSelectedByRole] = useState<Record<IPLTeamRole, string | null>>({
    batsman: null,
    bowler: null,
    allRounder: null,
    captain: null,
    emerging: null,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!firestore || !matchId) return;
    (async () => {
      const [m, picks] = await Promise.all([
        getIPLMatch(firestore, matchId),
        getIPLUserPicksByTournament(firestore, TOURNAMENT_ID),
      ]);
      setMatch(m);
      setTotalUsers(picks.length);
      if (!m) {
        setLoading(false);
        return;
      }
      const [teamAPlayers, teamBPlayers, selectionStats] = await Promise.all([
        getIPLPlayersByTeam(firestore, m.teamA),
        getIPLPlayersByTeam(firestore, m.teamB),
        getSelectionStatsForMatch(firestore, matchId),
      ]);
      const allPlayers = [...teamAPlayers, ...teamBPlayers];
      const totalUsersInMatch = picks.length || 1;
      const selectionMap = new Map(
        selectionStats.map((s) => [
          s.playerId,
          totalUsersInMatch > 0 ? (s.totalSelections / totalUsersInMatch) * 100 : 0,
        ])
      );
      setPlayers(
        allPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          team: p.team,
          role: p.role,
          isEmerging: p.isEmerging,
          selectionPercentage: Math.round((selectionMap.get(p.id) ?? 0) * 100) / 100,
          multiplier: getMultiplierFromSelectionPercentage(selectionMap.get(p.id) ?? 0),
        }))
      );
      if (user) {
        const userPick = await getIPLUserPick(firestore, TOURNAMENT_ID, user.uid);
        setPick(userPick);
        if (userPick) {
          setSelectedByRole({
            batsman: userPick.currentBatsmanId || null,
            bowler: userPick.bowlerId ?? null,
            allRounder: userPick.allRounderId ?? null,
            captain: userPick.captainId ?? null,
            emerging: userPick.emergingPlayerId ?? null,
          });
        }
      }
      setLoading(false);
    })();
  }, [firestore, matchId, user?.uid]);

  const isLocked = useMemo(() => {
    if (!match?.matchStartTime) return false;
    const start =
      'seconds' in match.matchStartTime
        ? new Date(match.matchStartTime.seconds * 1000)
        : new Date(0);
    const lockAt = new Date(start.getTime() - LOCK_MINUTES_BEFORE * 60 * 1000);
    return new Date() >= lockAt;
  }, [match?.matchStartTime]);

  const playersForRole = (roleKey: (typeof ROLE_CONFIG)[number]) => {
    if (roleKey.filterRole)
      return players.filter((p) => p.role === roleKey.filterRole);
    return players;
  };

  const hasBatsman = !!selectedByRole.batsman;
  const switchWarningsByRole = useMemo(() => {
    if (!pick) return {} as Record<IPLTeamRole, boolean>;
    return {
      batsman:
        !!pick.currentBatsmanId &&
        !!selectedByRole.batsman &&
        pick.currentBatsmanId !== selectedByRole.batsman,
      bowler:
        !!pick.bowlerId &&
        selectedByRole.bowler !== null &&
        pick.bowlerId !== selectedByRole.bowler,
      allRounder:
        !!pick.allRounderId &&
        selectedByRole.allRounder !== null &&
        pick.allRounderId !== selectedByRole.allRounder,
      captain:
        !!pick.captainId &&
        selectedByRole.captain !== null &&
        pick.captainId !== selectedByRole.captain,
      emerging:
        !!pick.emergingPlayerId &&
        selectedByRole.emerging !== null &&
        pick.emergingPlayerId !== selectedByRole.emerging,
    };
  }, [pick, selectedByRole]);

  const handleConfirmLock = async () => {
    if (!firestore || !user || !match) return;
    if (!selectedByRole.batsman) {
      toast({ title: 'Select at least Batsman', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const lockRes = await fetch(`/api/ipl/validate-lock?matchId=${matchId}`);
      const lockData = await lockRes.json().catch(() => ({}));
      if (lockData.locked) {
        toast({
          title: 'Selection locked',
          description: lockData.message ?? 'Selection locked for this match.',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      let pickId = pick?.id;
      const roles: IPLTeamRole[] = ['batsman', 'bowler', 'allRounder', 'captain', 'emerging'];
      let penaltyAppliedThisLock = 0;

      if (!pick) {
        pickId = await createIPLUserPick(firestore, user.uid, TOURNAMENT_ID, selectedByRole.batsman, {
          bowlerId: selectedByRole.bowler ?? undefined,
          allRounderId: selectedByRole.allRounder ?? undefined,
          captainId: selectedByRole.captain ?? undefined,
          emergingPlayerId: selectedByRole.emerging ?? undefined,
          underratedPlayerId: selectedByRole.batsman ?? undefined,
        });
        for (const r of roles) {
          const pid = selectedByRole[r];
          if (pid) await incrementSelectionCount(firestore, matchId, pid);
        }
      } else {
        let freeSwitchesLeft = pick.freeSwitchesLeft;
        let currentTotalPoints = pick.totalPoints;
        for (const r of roles) {
          const newId = selectedByRole[r] ?? null;
          const currentId = getCurrentPlayerIdForRole(pick, r);
          if (newId === currentId) continue;
          if (r === 'batsman') {
            if (pick.currentBatsmanId) await decrementSelectionCount(firestore, matchId, pick.currentBatsmanId);
            const result = await updateIPLUserPickBatsman(firestore, pickId!, newId!, {
              freeSwitchesLeft,
              currentTotalPoints,
            });
            freeSwitchesLeft = result.newFreeSwitchesLeft;
            currentTotalPoints = Math.max(0, currentTotalPoints + result.penaltyApplied);
            if (result.penaltyApplied < 0) {
              penaltyAppliedThisLock += result.penaltyApplied;
              toast({
                title: 'Switch penalty (Batsman)',
                description: `${SWITCH_PENALTY_POINTS} points deducted.`,
                variant: 'destructive',
              });
            }
            await incrementSelectionCount(firestore, matchId, newId!);
          } else {
            if (currentId && !newId) {
              await decrementSelectionCount(firestore, matchId, currentId);
              await clearIPLUserPickRole(firestore, pickId!, r);
              continue;
            }
            if (currentId) await decrementSelectionCount(firestore, matchId, currentId);
            if (newId) {
              const result = await updateIPLUserPickRole(firestore, pickId!, r, newId, {
                freeSwitchesLeft,
                currentTotalPoints,
                currentPlayerIdForRole: currentId,
              });
              freeSwitchesLeft = result.newFreeSwitchesLeft;
              currentTotalPoints = Math.max(0, currentTotalPoints + result.penaltyApplied);
              if (result.penaltyApplied < 0) {
                penaltyAppliedThisLock += result.penaltyApplied;
                toast({
                  title: `Switch penalty (${ROLE_CONFIG.find((c) => c.key === r)?.label ?? r})`,
                  description: `${SWITCH_PENALTY_POINTS} points deducted.`,
                  variant: 'destructive',
                });
              }
              await incrementSelectionCount(firestore, matchId, newId);
            }
          }
        }
      }

      const totalForPct = pick ? totalUsers : totalUsers + 1;
      await updateSelectionPercentagesForMatch(firestore, matchId, totalForPct);
      await lockIPLUserPickForMatch(firestore, pickId!, matchId, {
        underratedPlayerId: selectedByRole.batsman ?? undefined,
        switchPenalty: penaltyAppliedThisLock,
      });

      toast({ title: 'Team locked', description: 'Your selections for this match are locked.' });
      setConfirmOpen(false);
      router.push('/fantasy/ipl');
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to lock selection',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !match) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const anySwitchWarning = Object.values(switchWarningsByRole).some(Boolean);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fantasy/ipl">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Select your team</h1>
          <p className="text-muted-foreground text-sm">
            {match.teamA} vs {match.teamB}
          </p>
        </div>
      </div>

      {isLocked ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Selections are locked for this match (30 min before start).</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/fantasy/ipl">Back to IPL Fantasy</Link>
            </Button>
          </CardContent>
        </Card>
      ) : players.length === 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-8 text-center">
            <p className="font-medium text-foreground">No players available for this match</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Roster for {match.teamA} and {match.teamB} is not loaded yet. An admin must seed IPL players
              (Admin → IPL Fantasy → Players → &quot;Seed IPL 2026 players&quot;) so you can pick your team.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/fantasy/ipl">Back to IPL Fantasy</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="batsman" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              {ROLE_CONFIG.map((r) => (
                <TabsTrigger key={r.key} value={r.key} className="text-xs sm:text-sm flex items-center gap-1">
                  {r.icon}
                  <span className="hidden sm:inline">{r.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {ROLE_CONFIG.map((roleConfig) => (
              <TabsContent key={roleConfig.key} value={roleConfig.key}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{roleConfig.label}</CardTitle>
                    <CardDescription>{roleConfig.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {playersForRole(roleConfig).map((p) => {
                        const isSelected = selectedByRole[roleConfig.key] === p.id;
                        return (
                          <Card
                            key={p.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                            }`}
                            onClick={() =>
                              setSelectedByRole((prev) => ({
                                ...prev,
                                [roleConfig.key]: isSelected ? null : p.id,
                              }))
                            }
                          >
                            <CardHeader className="pb-2 py-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-base">{p.name}</CardTitle>
                                {roleConfig.key === 'batsman' && p.multiplier > 1 && (
                                  <span className="flex items-center gap-1 rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                                    <Zap className="w-3 h-3" />
                                    {p.multiplier}x
                                  </span>
                                )}
                                {roleConfig.key === 'emerging' && p.isEmerging && (
                                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    Emerging
                                  </span>
                                )}
                              </div>
                              <CardDescription>
                                {p.team} · {p.role}
                              </CardDescription>
                            </CardHeader>
                            {roleConfig.key === 'batsman' && (
                              <CardContent className="pt-0 text-sm text-muted-foreground">
                                Selection: {p.selectionPercentage}%
                                {p.selectionPercentage < 10 && (
                                  <span className="ml-2 text-primary font-medium">Underrated pick</span>
                                )}
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end">
            <Button disabled={!hasBatsman} onClick={() => setConfirmOpen(true)}>
              Lock team
            </Button>
          </div>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm team</DialogTitle>
            <DialogDescription>
              Batsman: {selectedByRole.batsman ? players.find((p) => p.id === selectedByRole.batsman)?.name : '—'}
              {selectedByRole.bowler && (
                <> · Bowler: {players.find((p) => p.id === selectedByRole.bowler)?.name}</>
              )}
              {selectedByRole.allRounder && (
                <> · All-Rounder: {players.find((p) => p.id === selectedByRole.allRounder)?.name}</>
              )}
              {selectedByRole.captain && (
                <> · Captain: {players.find((p) => p.id === selectedByRole.captain)?.name}</>
              )}
              {selectedByRole.emerging && (
                <> · Emerging: {players.find((p) => p.id === selectedByRole.emerging)?.name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          {anySwitchWarning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Changing picks</p>
                <p className="text-muted-foreground">
                  {pick?.freeSwitchesLeft && pick.freeSwitchesLeft > 0
                    ? 'You have a free switch left. One change will not incur a penalty.'
                    : `Each role change will deduct ${SWITCH_PENALTY_POINTS} points.`}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLock} disabled={submitting}>
              {submitting ? 'Locking...' : 'Lock team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
