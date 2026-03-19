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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [useOfficialFirstPhase, setUseOfficialFirstPhase] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllFiltered = () => setSelectedIds(new Set(filtered.map((m) => m.id)));
  const clearSelection = () => setSelectedIds(new Set());
  const isAllFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));
  const isSomeFilteredSelected = filtered.some((m) => selectedIds.has(m.id));

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

  const deleteSelected = async () => {
    if (!firestore || selectedIds.size === 0) return;
    setDeletingBulk(true);
    try {
      let done = 0;
      for (const id of selectedIds) {
        try {
          await deleteIPLMatch(firestore, id);
          done++;
        } catch (e) {
          console.error('Delete match failed', id, e);
        }
      }
      toast({
        title: 'Bulk delete',
        description: `${done} of ${selectedIds.size} match(es) deleted.`,
      });
      setSelectedIds(new Set());
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Bulk delete failed',
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setDeletingBulk(false);
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
      } = await insertGeneratedIPLSchedule(firestore, {
        startDate: '2026-03-28',
        useOfficialFirstPhase,
      });
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
            Generate IPL schedule
          </CardTitle>
          <CardDescription>
            By default uses <strong>official IPL 2026 first phase</strong> (20 matches, 28 Mar–12 Apr, BCCI announced). Creates matches in both IPL Fantasy and Cricket Fantasy. Uncheck for full programmatic season (90 league + 4 playoffs). Duplicates skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={useOfficialFirstPhase}
              onCheckedChange={(v) => setUseOfficialFirstPhase(v === true)}
            />
            <span className="text-sm">Official first phase only (20 matches, 28 Mar–12 Apr 2026)</span>
          </label>
          <Button onClick={generateFullSchedule} disabled={!firestore || generating}>
            {generating ? 'Generating…' : useOfficialFirstPhase ? 'Generate official schedule (20 matches)' : 'Generate full programmatic schedule'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Match list</CardTitle>
            <CardDescription>Sorted by start time (newest first). Select rows then delete selected.</CardDescription>
          </div>
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => (isAllFilteredSelected ? clearSelection() : selectAllFiltered())}
              >
                {isAllFilteredSelected ? 'Clear selection' : 'Select all'}
              </Button>
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm" disabled={deletingBulk}>
                      {deletingBulk ? 'Deleting…' : `Delete selected (${selectedIds.size})`}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedIds.size} match(es)?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the match documents from IPL Fantasy. User picks and stats for these matches are not auto-deleted. You can then generate a fresh schedule.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteSelected}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
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
                    <th className="w-10 pb-2 pr-2">
                      <Checkbox
                        checked={isAllFilteredSelected ? true : isSomeFilteredSelected ? 'indeterminate' : false}
                        onCheckedChange={() => (isAllFilteredSelected ? clearSelection() : selectAllFiltered())}
                        aria-label="Select all"
                      />
                    </th>
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
                        <td className="w-10 py-3 pr-2">
                          <Checkbox
                            checked={selectedIds.has(m.id)}
                            onCheckedChange={() => toggleSelect(m.id)}
                            aria-label={`Select ${m.teamA} vs ${m.teamB}`}
                          />
                        </td>
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
