'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  adminRecalculateAllPickTotalsInTournament,
  adminFixMismatchedTotals,
  adminRemoveMatchFromAllHistories,
} from '@/firebase/firestore/ipl-fantasy-admin';
import { IPL_TOURNAMENT_ID } from '@/lib/ipl-constants';
import { ArrowLeft, RefreshCw, Wrench, Trash2 } from 'lucide-react';
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

export default function AdminIPLToolsPage() {
  const firestore = useFirestore();
  const [matchIdReset, setMatchIdReset] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [fixDetails, setFixDetails] = useState<string[]>([]);

  const recalcAll = async () => {
    if (!firestore) return;
    setBusy('recalc');
    try {
      const { updated, errors } = await adminRecalculateAllPickTotalsInTournament(
        firestore,
        IPL_TOURNAMENT_ID
      );
      toast({
        title: 'Recalculate complete',
        description: `Updated ${updated} picks. ${errors.length ? `${errors.length} errors.` : ''}`,
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed', description: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const fixDryRun = async () => {
    if (!firestore) return;
    setBusy('fix-dry');
    try {
      const { mismatches, details } = await adminFixMismatchedTotals(firestore, IPL_TOURNAMENT_ID, true);
      setFixDetails(details);
      toast({ title: 'Dry run', description: `${mismatches} mismatch(es)` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed', description: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const fixApply = async () => {
    if (!firestore) return;
    setBusy('fix');
    try {
      const { fixed, mismatches, details } = await adminFixMismatchedTotals(
        firestore,
        IPL_TOURNAMENT_ID,
        false
      );
      setFixDetails(details);
      toast({ title: 'Fixed totals', description: `${fixed} updated of ${mismatches} mismatches` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed', description: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const resetMatch = async () => {
    if (!firestore || !matchIdReset.trim()) {
      toast({ variant: 'destructive', title: 'Enter matchId' });
      return;
    }
    setBusy('reset');
    try {
      const { updated, errors } = await adminRemoveMatchFromAllHistories(
        firestore,
        IPL_TOURNAMENT_ID,
        matchIdReset.trim()
      );
      toast({
        title: 'Reset match history',
        description: `Updated ${updated} users. ${errors.length ? 'Some errors.' : ''}`,
      });
      setMatchIdReset('');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed', description: String(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/fantasy/ipl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            IPL Admin
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Debug & safety</h1>
        <p className="text-sm text-muted-foreground">Use with care on production data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Recalculate points
          </CardTitle>
          <CardDescription>
            Sets <code>totalPoints</code> = sum(history) for every pick in {IPL_TOURNAMENT_ID}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled={!firestore || busy !== null} onClick={recalcAll}>
            {busy === 'recalc' ? 'Running…' : 'Recalculate all totals from history'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Fix mismatched totals
          </CardTitle>
          <CardDescription>Compare stored totalPoints to sum(history); optionally fix.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!firestore || busy !== null} onClick={fixDryRun}>
              {busy === 'fix-dry' ? '…' : 'Dry run (list mismatches)'}
            </Button>
            <Button variant="secondary" disabled={!firestore || busy !== null} onClick={fixApply}>
              {busy === 'fix' ? 'Fixing…' : 'Apply fix'}
            </Button>
          </div>
          {fixDetails.length > 0 && (
            <pre className="text-xs bg-muted p-3 rounded-md max-h-48 overflow-auto">
              {fixDetails.join('\n')}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Reset match (testing)
          </CardTitle>
          <CardDescription>
            Removes the history entry for this <code>matchId</code> from all users and recalculates totals.
            Does not delete <code>player_match_stats</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Match document ID</Label>
            <Input
              value={matchIdReset}
              onChange={(e) => setMatchIdReset(e.target.value)}
              placeholder="Firestore match id"
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!firestore || busy !== null || !matchIdReset.trim()}>
                {busy === 'reset' ? '…' : 'Reset match in all histories'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove scoring for this match?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone from the UI. Confirm you have the correct matchId.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetMatch}>Confirm reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
