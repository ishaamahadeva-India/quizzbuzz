'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  addIPLMatch,
  deleteIPLMatch,
  getIPLMatchesDescending,
  insertGeneratedIPLSchedule,
  updateIPLMatch,
  updateIPLMatchStatus,
} from '@/firebase/firestore/ipl-matches';
import type { IPLMatchStatus } from '@/lib/types';
import { ArrowLeft, CalendarPlus, Play, Square, Pencil, Trash2, Table2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminIPLMatchesPage() {
  const firestore = useFirestore();
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getIPLMatchesDescending>>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<IPLMatchStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<(typeof matches)[0] | null>(null);
  const [formTeamA, setFormTeamA] = useState('');
  const [formTeamB, setFormTeamB] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formStatus, setFormStatus] = useState<IPLMatchStatus>('upcoming');
  const [formWinner, setFormWinner] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const data = await getIPLMatchesDescending(firestore);
      setMatches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [firestore]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return matches;
    return matches.filter((m) => m.status === statusFilter);
  }, [matches, statusFilter]);

  const openCreate = () => {
    setFormTeamA('');
    setFormTeamB('');
    setFormStart('');
    setFormStatus('upcoming');
    setFormWinner('');
    setEditMatch(null);
    setCreateOpen(true);
  };

  const openEdit = (m: (typeof matches)[0]) => {
    setEditMatch(m);
    setFormTeamA(m.teamA);
    setFormTeamB(m.teamB);
    const sec = 'seconds' in m.matchStartTime ? m.matchStartTime.seconds : 0;
    const d = new Date(sec * 1000);
    setFormStart(d.toISOString().slice(0, 16));
    setFormStatus(m.status);
    setFormWinner(m.winnerTeamId ?? '');
    setCreateOpen(true);
  };

  const saveMatch = async () => {
    if (!firestore || !formTeamA.trim() || !formTeamB.trim() || !formStart) {
      toast({ title: 'Fill team A, B and start time', variant: 'destructive' });
      return;
    }
    const startDate = new Date(formStart);
    setSaving(true);
    try {
      if (editMatch) {
        await updateIPLMatch(firestore, editMatch.id, {
          teamA: formTeamA.trim(),
          teamB: formTeamB.trim(),
          matchStartTime: startDate,
          status: formStatus,
          winnerTeamId: formWinner.trim() || null,
        });
        toast({ title: 'Match updated' });
      } else {
        await addIPLMatch(firestore, {
          teamA: formTeamA.trim(),
          teamB: formTeamB.trim(),
          matchStartTime: startDate,
          status: formStatus,
        });
        toast({ title: 'Match created' });
      }
      setCreateOpen(false);
      await load();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Save failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const setLive = async (id: string) => {
    if (!firestore) return;
    try {
      await updateIPLMatchStatus(firestore, id, 'live');
      toast({ title: 'Match is live' });
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to start match' });
    }
  };

  const setCompleted = async (id: string) => {
    if (!firestore) return;
    try {
      await updateIPLMatchStatus(firestore, id, 'completed');
      toast({ title: 'Match completed' });
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to end match' });
    }
  };

  const remove = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteIPLMatch(firestore, id);
      toast({ title: 'Match deleted' });
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const generateFullSchedule = async () => {
    if (!firestore) return;
    setGenerating(true);
    try {
      const {
        inserted,
        skipped,
        errors,
        cricketInserted,
        cricketSkipped,
        cricketErrors,
      } = await insertGeneratedIPLSchedule(firestore, { startDate: '2026-03-22' });
      const hasErrors = errors.length > 0 || cricketErrors.length > 0;
      const parts = [
        `IPL (pick'em): ${inserted} added, ${skipped} skipped`,
        `Cricket (T20/IPL): ${cricketInserted} added, ${cricketSkipped} skipped`,
      ];
      if (hasErrors) {
        toast({
          variant: 'destructive',
          title: 'Schedule generated with some errors',
          description: parts.join('. ') + (errors.length + cricketErrors.length ? ` ${errors.length + cricketErrors.length} error(s).` : ''),
        });
      } else {
        toast({
          title: 'Schedule generated',
          description: parts.join('. ') + '. Users can join unified IPL fantasy or individual cricket matches.',
        });
      }
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Generate failed',
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/admin/fantasy/ipl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              IPL Admin
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">IPL Matches</h1>
          <p className="text-sm text-muted-foreground">Create fixtures, control status, open stats entry.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>Create match</Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Generate full IPL schedule
          </CardTitle>
          <CardDescription>
            10 teams, double round-robin (~90 league) + 4 playoffs. Start 2026-03-22. Creates matches in both IPL Fantasy (pick&apos;em) and Cricket Fantasy (T20/IPL) so users can join unified IPL or individual matches. Duplicates skipped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateFullSchedule} disabled={!firestore || generating}>
            {generating ? 'Generating…' : 'Generate Full IPL Schedule'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Match list</CardTitle>
          <CardDescription>Sorted by start time (newest first)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">No matches.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Teams</th>
                    <th className="pb-2 pr-4">Start</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Winner</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const sec = 'seconds' in m.matchStartTime ? m.matchStartTime.seconds : 0;
                    const when = sec ? new Date(sec * 1000).toLocaleString() : '—';
                    return (
                      <tr key={m.id} className="border-b border-border/60">
                        <td className="py-3 pr-4 font-medium">
                          {m.teamA} vs {m.teamB}
                        </td>
                        <td className="py-3 pr-4">{when}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={m.status === 'live' ? 'default' : 'secondary'}>{m.status}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{m.winnerTeamId ?? '—'}</td>
                        <td className="py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/fantasy/ipl/match/${m.id}/stats`}>
                                <Table2 className="w-3.5 h-3.5 mr-1" />
                                Stats
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            {m.status === 'upcoming' && (
                              <Button size="sm" variant="secondary" onClick={() => setLive(m.id)}>
                                <Play className="w-3.5 h-3.5 mr-1" />
                                Start
                              </Button>
                            )}
                            {m.status === 'live' && (
                              <Button size="sm" variant="secondary" onClick={() => setCompleted(m.id)}>
                                <Square className="w-3.5 h-3.5 mr-1" />
                                End
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete match?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This removes the match document. Stats and picks are not auto-deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => remove(m.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editMatch ? 'Edit match' : 'Create match'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Team A</Label>
              <Input value={formTeamA} onChange={(e) => setFormTeamA(e.target.value)} placeholder="e.g. CSK" />
            </div>
            <div>
              <Label>Team B</Label>
              <Input value={formTeamB} onChange={(e) => setFormTeamB(e.target.value)} placeholder="e.g. MI" />
            </div>
            <div>
              <Label>Match start (local)</Label>
              <Input type="datetime-local" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as IPLMatchStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">upcoming</SelectItem>
                  <SelectItem value="live">live</SelectItem>
                  <SelectItem value="completed">completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Winner team id (captain bonus)</Label>
              <Input
                value={formWinner}
                onChange={(e) => setFormWinner(e.target.value)}
                placeholder="Same as team code, e.g. CSK"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMatch} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
