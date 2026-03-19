'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  addIPLPlayer,
  getAllIPLPlayersForAdmin,
  insertSeedIPLPlayers,
  updateIPLPlayer,
} from '@/firebase/firestore/ipl-players';
import type { IPLPlayerRole } from '@/lib/types';
import { ArrowLeft, Plus, Pencil, Users } from 'lucide-react';

export default function AdminIPLPlayersPage() {
  const firestore = useFirestore();
  const [players, setPlayers] = useState<Awaited<ReturnType<typeof getAllIPLPlayersForAdmin>>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [role, setRole] = useState<IPLPlayerRole>('batsman');
  const [isActive, setIsActive] = useState(true);
  const [isEmerging, setIsEmerging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      setPlayers(await getAllIPLPlayersForAdmin(firestore));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [firestore]);

  const openNew = () => {
    setEditId(null);
    setName('');
    setTeam('');
    setRole('batsman');
    setIsActive(true);
    setIsEmerging(false);
    setDialogOpen(true);
  };

  const openEdit = (p: (typeof players)[0]) => {
    setEditId(p.id);
    setName(p.name);
    setTeam(p.team);
    setRole(p.role);
    setIsActive(p.isActive);
    setIsEmerging(p.isEmerging ?? false);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!firestore || !name.trim() || !team.trim()) {
      toast({ title: 'Name and team required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateIPLPlayer(firestore, editId, {
          name: name.trim(),
          team: team.trim(),
          role,
          isActive,
          isEmerging,
        });
        toast({ title: 'Player updated' });
      } else {
        await addIPLPlayer(firestore, {
          name: name.trim(),
          team: team.trim(),
          role,
          isActive,
          isEmerging,
        });
        toast({ title: 'Player added' });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e instanceof Error ? e.message : 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const seedPlayers = async () => {
    if (!firestore) return;
    setSeeding(true);
    try {
      const { inserted, skipped, errors } = await insertSeedIPLPlayers(firestore);
      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Seed completed with errors',
          description: `${inserted} added, ${skipped} skipped. ${errors.length} error(s).`,
        });
      } else {
        toast({
          title: 'Seed completed',
          description: `${inserted} player(s) added, ${skipped} already existed (skipped).`,
        });
      }
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Seed failed',
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSeeding(false);
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
          <h1 className="text-2xl font-bold">IPL Players</h1>
          <p className="text-sm text-muted-foreground">All players (including inactive).</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add player
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seed IPL 2026 players
          </CardTitle>
          <CardDescription>
            Bulk insert predefined squad (all 10 teams). Skips players that already exist (same name + team).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={seedPlayers} disabled={!firestore || seeding}>
            {seeding ? 'Seeding…' : 'Seed IPL 2026 players'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>Sorted by name</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Team</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Active</th>
                    <th className="pb-2 pr-4">Emerging</th>
                    <th className="pb-2 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4">{p.team}</td>
                      <td className="py-2 pr-4">{p.role}</td>
                      <td className="py-2 pr-4">
                        {p.isActive ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>}
                      </td>
                      <td className="py-2 pr-4">{p.isEmerging ? 'Yes' : '—'}</td>
                      <td className="py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit player' : 'Add player'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Team code</Label>
              <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Must match match teamA/teamB" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as IPLPlayerRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batsman">batsman</SelectItem>
                  <SelectItem value="bowler">bowler</SelectItem>
                  <SelectItem value="allrounder">allrounder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Emerging (1.5x in emerging slot)</Label>
              <Switch checked={isEmerging} onCheckedChange={setIsEmerging} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
