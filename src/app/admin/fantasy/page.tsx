'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Trophy, ListOrdered, BarChart3, Users, Gamepad } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { FantasyCampaign, FantasyMatch } from '@/lib/types';
import { deleteFantasyCampaign, addFantasyCampaign } from '@/firebase/firestore/fantasy-campaigns';
import { deleteCricketMatch, addCricketMatch } from '@/firebase/firestore/cricket-matches';
import { deleteCricketTournament, addCricketTournament } from '@/firebase/firestore/cricket-tournaments';
import Link from 'next/link';
import { CSVUpload } from '@/components/admin/csv-upload';
import { downloadCampaignsTemplate, downloadMatchesTemplate, downloadTournamentsTemplate } from '@/lib/csv-templates';
import { parseCSVDate } from '@/lib/utils';
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


// Extend types to include Firestore document ID
type FantasyCampaignWithId = FantasyCampaign & { id: string };
type FantasyMatchWithId = FantasyMatch & { id: string };
type CricketTournamentWithId = import('@/lib/types').CricketTournament & { id: string };

export default function AdminFantasyPage() {
  const firestore = useFirestore();
  
  const campaignsQuery = firestore ? collection(firestore, 'fantasy-campaigns') : null;
  const matchesQuery = firestore ? collection(firestore, 'fantasy_matches') : null;
  const tournamentsQuery = firestore ? collection(firestore, 'cricket-tournaments') : null;
  
  const { data: campaignsData, isLoading: campaignsLoading } = useCollection(campaignsQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection(matchesQuery);
  const { data: tournamentsData, isLoading: tournamentsLoading } = useCollection(tournamentsQuery);
  
  const campaigns = campaignsData as FantasyCampaignWithId[] | undefined;
  const matches = matchesData as FantasyMatchWithId[] | undefined;
  const tournaments = tournamentsData as CricketTournamentWithId[] | undefined;

  const handleDeleteCampaign = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteFantasyCampaign(firestore, id);
      toast({ title: 'Campaign Deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting campaign' });
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteCricketMatch(firestore, id);
      toast({ title: 'Match Deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting match' });
    }
  };


  const handleCampaignsCSVUpload = async (rows: any[], currentIndex?: number, total?: number) => {
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }
    
    const row = rows[0];
    
    if (!row) {
      throw new Error('No row data provided');
    }

    if (!row.title || row.title.trim() === '') {
      throw new Error(`Row ${currentIndex || '?'} missing title`);
    }

    try {
      await addFantasyCampaign(firestore, {
        title: row.title.trim(),
        campaignType: (row.campaignType || 'single_movie') as 'single_movie' | 'multiple_movies',
        description: row.description?.trim() || undefined,
        prizePool: row.prizePool?.trim() || undefined,
        sponsorName: row.sponsorName?.trim() || undefined,
        sponsorLogo: row.sponsorLogo?.trim() || undefined,
        movieId: row.movieId?.trim() || undefined,
        movieTitle: row.movieTitle?.trim() || undefined,
        movieLanguage: row.movieLanguage?.trim() || undefined,
        startDate: parseCSVDate(row.startDate, 'startDate'),
        endDate: row.endDate ? parseCSVDate(row.endDate, 'endDate') : undefined,
        status: (row.status || 'upcoming') as 'upcoming' | 'active' | 'completed',
        visibility: (row.visibility || 'public') as 'public' | 'private' | 'invite_only',
        maxParticipants: row.maxParticipants ? parseInt(row.maxParticipants) : undefined,
        entryFee: {
          type: 'free' as const, // All contests are free - entryFeeType from CSV is ignored
        },
      });
      
      if (currentIndex && total) {
        console.log(`✅ Uploaded campaign ${currentIndex}/${total}: "${row.title}"`);
      } else {
        console.log(`✅ Uploaded campaign: "${row.title}"`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to upload campaign "${row.title}":`, error);
      throw error;
    }
  };

  const handleMatchesCSVUpload = async (rows: any[], currentIndex?: number, total?: number) => {
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }
    
    const row = rows[0];
    
    if (!row) {
      throw new Error('No row data provided');
    }

    if (!row.matchName || row.matchName.trim() === '') {
      throw new Error(`Row ${currentIndex || '?'} missing matchName`);
    }

    try {
      const teams = row.teams ? row.teams.split(',').map((t: string) => t.trim()) : [];
      await addCricketMatch(firestore, {
        matchName: row.matchName.trim(),
        format: (row.format || 'T20') as "T20" | "ODI" | "Test" | "IPL",
        teams: teams,
        team1: row.team1?.trim() || teams[0] || '',
        team2: row.team2?.trim() || teams[1] || '',
        venue: row.venue?.trim() || undefined,
        startTime: parseCSVDate(row.startTime, 'startTime'),
        status: (row.status || 'upcoming') as "upcoming" | "live" | "completed",
        description: row.description?.trim() || undefined,
        entryFee: {
          type: 'free' as const, // All contests are free - entryFeeType from CSV is ignored
        },
        maxParticipants: row.maxParticipants ? parseInt(row.maxParticipants) : undefined,
      });
      
      if (currentIndex && total) {
        console.log(`✅ Uploaded match ${currentIndex}/${total}: "${row.matchName}"`);
      } else {
        console.log(`✅ Uploaded match: "${row.matchName}"`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to upload match "${row.matchName}":`, error);
      throw error;
    }
  };

  const handleTournamentsCSVUpload = async (rows: any[], currentIndex?: number, total?: number) => {
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }
    
    const row = rows[0];
    
    if (!row) {
      throw new Error('No row data provided');
    }

    if (!row.name || row.name.trim() === '') {
      throw new Error(`Row ${currentIndex || '?'} missing name`);
    }

    try {
      const teams = row.teams ? row.teams.split(',').map((t: string) => t.trim()) : [];
      await addCricketTournament(firestore, {
        name: row.name.trim(),
        format: (row.format || 'T20') as "T20" | "ODI" | "Test" | "IPL",
        description: row.description?.trim() || undefined,
        startDate: parseCSVDate(row.startDate, 'startDate', true),
        endDate: parseCSVDate(row.endDate, 'endDate', true),
        status: (row.status || 'upcoming') as 'upcoming' | 'live' | 'completed',
        teams: teams,
        venue: row.venue?.trim() || undefined,
        entryFee: {
          type: (row.entryFeeType || 'free') as 'free' | 'paid',
          amount: row.entryFeeAmount ? parseFloat(row.entryFeeAmount) : undefined,
        },
        maxParticipants: row.maxParticipants ? parseInt(row.maxParticipants) : undefined,
        prizePool: row.prizePool?.trim() || undefined,
        sponsorName: row.sponsorName?.trim() || undefined,
        sponsorLogo: row.sponsorLogo?.trim() || undefined,
        visibility: (row.visibility || 'public') as 'public' | 'private' | 'invite_only',
      });
      
      if (currentIndex && total) {
        console.log(`✅ Uploaded tournament ${currentIndex}/${total}: "${row.name}"`);
      } else {
        console.log(`✅ Uploaded tournament: "${row.name}"`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to upload tournament "${row.name}":`, error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gamepad className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold md:text-4xl font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Fantasy Game Management
            </h1>
          </div>
          <p className="text-muted-foreground ml-12 mb-4">
            Manage Movie Fantasy Leagues and Live Cricket Matches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/fantasy/analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/fantasy/users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-primary/25 bg-primary/5 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-primary" />
              IPL Fantasy (pick&apos;em)
            </CardTitle>
            <CardDescription className="mt-1">
              Admin: matches, players, per-match stats, selection %, scoring, leaderboard &amp; tools.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/fantasy/ipl">Open IPL admin</Link>
          </Button>
        </CardHeader>
      </Card>

      <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Cricket Tournaments / Series
              </CardTitle>
              <CardDescription className="mt-1">
                Create and manage tournament-level fantasy (IPL, World Cup, Series, etc.).
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <CSVUpload
                onUpload={handleTournamentsCSVUpload}
                title="Upload Tournaments CSV"
                description="Upload multiple tournaments at once. CSV should have columns: name, format, description, startDate, endDate, status, teams (comma-separated), venue, entryFeeType, entryFeeAmount, maxParticipants, prizePool, sponsorName, sponsorLogo, visibility"
                exampleHeaders={['name', 'format', 'startDate', 'endDate', 'status', 'teams', 'entryFeeType']}
                buttonText="Upload CSV"
                onDownloadTemplate={downloadTournamentsTemplate}
              />
              <Button size="sm" asChild>
                <Link href="/admin/fantasy/tournament/new">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Tournament
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tournamentsLoading && (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Skeleton className="h-5 w-72" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </>
          )}
          {tournaments && tournaments.map((tournament) => (
            <div 
              key={tournament.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-base">{tournament.name}</p>
                  <Badge 
                    variant={tournament.status === 'live' ? 'destructive' : tournament.status === 'completed' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {tournament.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{tournament.format}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {tournament.teams.length} teams • {tournament.startDate && (tournament.startDate instanceof Date ? tournament.startDate.toLocaleDateString() : new Date((tournament.startDate as any).seconds * 1000).toLocaleDateString())}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/fantasy/tournament/edit/${tournament.id}`} title="Edit">
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/fantasy/tournament/${tournament.id}/results`} title="Results">
                    <Trophy className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/fantasy/tournament/${tournament.id}/leaderboard`} title="Leaderboard">
                    <ListOrdered className="w-4 h-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the tournament "{tournament.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        if (firestore) {
                          deleteCricketTournament(firestore, tournament.id);
                          toast({ title: 'Tournament Deleted' });
                        }
                      }}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {!tournamentsLoading && (!tournaments || tournaments.length === 0) && (
            <div className="text-center p-6 text-muted-foreground">
              No tournaments found. Click "New Tournament" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movie Fantasy Campaigns</CardTitle>
            <div className="flex gap-2">
              <CSVUpload
                onUpload={handleCampaignsCSVUpload}
                title="Upload Campaigns CSV"
                description="Upload multiple campaigns at once. CSV should have columns: title, campaignType, description, startDate, endDate, status, visibility, movieId, movieTitle, movieLanguage, entryFeeType, entryFeeAmount, maxParticipants, prizePool, sponsorName, sponsorLogo"
                exampleHeaders={['title', 'campaignType', 'startDate', 'endDate', 'status', 'entryFeeType']}
                buttonText="Upload CSV"
                onDownloadTemplate={downloadCampaignsTemplate}
              />
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/fantasy/campaign/new">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Campaign
                </Link>
              </Button>
            </div>
          </div>
          <CardDescription>
            Create and manage long-running movie prediction campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaignsLoading && (
            <>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <Skeleton className="h-5 w-64 mb-2" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            </>
          )}
          {campaigns && campaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <p className="font-semibold">{campaign.title}</p>
                    <p className="text-sm text-muted-foreground">{campaign.movieId}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                    <Badge variant="outline">{campaign.campaignType === 'multiple_movies' ? 'Multi-Movie' : 'Single Movie'}</Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/fantasy/campaign/edit/${campaign.id}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/fantasy/campaign/${campaign.id}/results`}>
                        <Trophy className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/fantasy/campaign/${campaign.id}/leaderboard`}>
                        <ListOrdered className="w-4 h-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the campaign "{campaign.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCampaign(campaign.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
          ))}
          {!campaignsLoading && campaigns?.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">No movie campaigns found.</div>
          )}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Cricket Matches</CardTitle>
            <div className="flex gap-2">
              <CSVUpload
                onUpload={handleMatchesCSVUpload}
                title="Upload Matches CSV"
                description="Upload multiple matches at once. CSV should have columns: matchName, format, team1, team2, teams (comma-separated), venue, startTime, status, description, entryFeeType, entryFeeAmount, maxParticipants"
                exampleHeaders={['matchName', 'format', 'team1', 'team2', 'startTime', 'status']}
                buttonText="Upload CSV"
                onDownloadTemplate={downloadMatchesTemplate}
              />
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/fantasy/match/new">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Match
                </Link>
              </Button>
            </div>
          </div>
          <CardDescription>
            Manage live, role-based fantasy cricket matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {matchesLoading && (
            <>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Skeleton className="h-5 w-72" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            </>
          )}
          {matches && matches.map((match) => {
            const linkedTournament = tournaments?.find((t: any) => t.id === match.tournamentId);
            return (
            <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <p className="font-semibold">{match.matchName}</p>
                    <p className="text-sm text-muted-foreground">
                      {match.format} • {match.team1} vs {match.team2}
                      {linkedTournament && (
                        <span className="ml-2">
                          • <Badge variant="outline" className="text-xs">
                            <Trophy className="w-3 h-3 mr-1 inline" />
                            {linkedTournament.name}
                          </Badge>
                        </span>
                      )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={match.status === 'live' ? 'destructive' : 'secondary'}>{match.status}</Badge>
                    <Badge variant="outline">{match.format}</Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/fantasy/match/edit/${match.id}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/fantasy/match/${match.id}/results`}>
                        <Trophy className="w-4 h-4" />
                      </Link>
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                             This will permanently delete the match "{match.matchName}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMatch(match.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            );
          })}
           {!matchesLoading && matches?.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">No cricket matches found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
