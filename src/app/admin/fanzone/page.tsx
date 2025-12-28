
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
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
import { deleteCricketer, addCricketer } from '@/firebase/firestore/cricketers';
import { deleteTeam, addTeam } from '@/firebase/firestore/teams';
import { deleteMovie, addMovie } from '@/firebase/firestore/movies';
import { deleteStar, addStar } from '@/firebase/firestore/stars';
import type { Movie, Star as StarType } from '@/lib/types';
import { BarChart3 } from 'lucide-react';
import { CSVUpload } from '@/components/admin/csv-upload';
import { downloadCricketersTemplate, downloadTeamsTemplate, downloadMoviesTemplate, downloadStarsTemplate } from '@/lib/csv-templates';

type CricketerProfile = {
    id: string;
    name: string;
    country: string;
    roles: string[];
}

type TeamProfile = {
    id: string;
    name: string;
    type: 'ip' | 'national';
}

export default function AdminFanZonePage() {
    const firestore = useFirestore();
    
    const cricketersQuery = firestore ? collection(firestore, 'cricketers') : null;
    const { data: cricketers, isLoading: cricketersLoading } = useCollection(cricketersQuery);

    const teamsQuery = firestore ? collection(firestore, 'teams') : null;
    const { data: teams, isLoading: teamsLoading } = useCollection(teamsQuery);
    
    const moviesQuery = firestore ? collection(firestore, 'movies') : null;
    const { data: movies, isLoading: moviesLoading } = useCollection(moviesQuery);

    const starsQuery = firestore ? collection(firestore, 'stars') : null;
    const { data: stars, isLoading: starsLoading } = useCollection(starsQuery);

    const handleDeleteCricketer = async (cricketerId: string) => {
        if (!firestore) return;
        try {
        await deleteCricketer(firestore, cricketerId);
        toast({
            title: 'Cricketer Deleted',
            description: 'The cricketer profile has been successfully deleted.',
        });
        } catch (error) {
        console.error('Error deleting cricketer: ', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the cricketer. Please try again.',
        });
        }
    };
    
    const handleDeleteTeam = async (teamId: string) => {
        if (!firestore) return;
        try {
            await deleteTeam(firestore, teamId);
            toast({
                title: 'Team Deleted',
                description: 'The team profile has been successfully deleted.',
            });
        } catch (error) {
            console.error('Error deleting team: ', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the team. Please try again.',
            });
        }
    };
    
    const handleDeleteMovie = async (movieId: string) => {
        if (!firestore) return;
        try {
            await deleteMovie(firestore, movieId);
            toast({
                title: 'Movie Deleted',
                description: 'The movie has been successfully deleted.',
            });
        } catch (error) {
            console.error('Error deleting movie: ', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the movie. Please try again.',
            });
        }
    };

    const handleDeleteStar = async (starId: string) => {
        if (!firestore) return;
        try {
            await deleteStar(firestore, starId);
            toast({
                title: 'Star Deleted',
                description: 'The star has been successfully deleted.',
            });
        } catch (error) {
            console.error('Error deleting star: ', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the star. Please try again.',
            });
        }
    };

    const handleCricketersCSVUpload = async (rows: any[], currentIndex?: number, total?: number) => {
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
            const roles = row.roles ? row.roles.split(',').map((r: string) => r.trim()) : [];
            const cricketerData: any = {
                name: row.name.trim(),
                country: row.country?.trim() || '',
                roles: roles,
            };
            
            // Only include avatarUrl if it exists and is not empty
            if (row.avatarUrl && row.avatarUrl.trim() !== '') {
                cricketerData.avatarUrl = row.avatarUrl.trim();
            }
            
            await addCricketer(firestore, cricketerData);
            
            if (currentIndex && total) {
                console.log(`✅ Uploaded cricketer ${currentIndex}/${total}: "${row.name}"`);
            } else {
                console.log(`✅ Uploaded cricketer: "${row.name}"`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to upload cricketer "${row.name}":`, error);
            throw error;
        }
    };

    const handleTeamsCSVUpload = async (rows: any[], currentIndex?: number, total?: number) => {
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
            const teamData: any = {
                name: row.name.trim(),
                type: (row.type || 'ip') as 'ip' | 'national',
            };
            
            // Only include logoUrl if it exists and is not empty
            if (row.logoUrl && row.logoUrl.trim() !== '') {
                teamData.logoUrl = row.logoUrl.trim();
            }
            
            await addTeam(firestore, teamData);
            
            if (currentIndex && total) {
                console.log(`✅ Uploaded team ${currentIndex}/${total}: "${row.name}"`);
            } else {
                console.log(`✅ Uploaded team: "${row.name}"`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to upload team "${row.name}":`, error);
            throw error;
        }
    };

    const handleMoviesCSVUpload = async (rows: any[], currentIndex?: number, total?: number) => {
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
            const movieData: any = {
                title: row.title.trim(),
                releaseYear: row.releaseYear ? parseInt(row.releaseYear) : new Date().getFullYear(),
                genre: row.genre?.trim() || '',
                industry: row.industry?.trim() || 'Bollywood', // Default to Bollywood if not specified
                description: row.description?.trim() || '',
            };
            
            // Only include optional fields if they exist and are not empty
            if (row.posterUrl && row.posterUrl.trim() !== '') {
                movieData.posterUrl = row.posterUrl.trim();
            }
            if (row.director && row.director.trim() !== '') {
                movieData.director = row.director.trim();
            }
            if (row.cast && row.cast.trim() !== '') {
                movieData.cast = row.cast.trim();
            }
            if (row.runtime && row.runtime.trim() !== '') {
                movieData.runtime = row.runtime.trim();
            }
            if (row.imdbRating && row.imdbRating.trim() !== '') {
                movieData.imdbRating = parseFloat(row.imdbRating);
            }
            if (row.language && row.language.trim() !== '') {
                movieData.language = row.language.trim();
            }
            
            await addMovie(firestore, movieData);
            
            if (currentIndex && total) {
                console.log(`✅ Uploaded movie ${currentIndex}/${total}: "${row.title}"`);
            } else {
                console.log(`✅ Uploaded movie: "${row.title}"`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to upload movie "${row.title}":`, error);
            throw error;
        }
    };

    const handleStarsCSVUpload = async (rows: any[], currentIndex?: number, total?: number) => {
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
            const genres = row.genre ? row.genre.split(',').map((g: string) => g.trim()) : [];
            await addStar(firestore, {
                name: row.name.trim(),
                genre: genres,
                avatar: row.avatar?.trim() || undefined,
            });
            
            if (currentIndex && total) {
                console.log(`✅ Uploaded star ${currentIndex}/${total}: "${row.name}"`);
            } else {
                console.log(`✅ Uploaded star: "${row.name}"`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to upload star "${row.name}":`, error);
            throw error;
        }
    };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="cricketers" className="w-full">
        <Card className="border-2 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Fan Zone Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage all entities within the Cricket and Movie Fan Zones.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/fanzone/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
              <TabsTrigger value="cricketers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-4">
                Cricketers
              </TabsTrigger>
              <TabsTrigger value="teams" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-4">
                Teams
              </TabsTrigger>
              <TabsTrigger value="movies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-4">
                Movies
              </TabsTrigger>
              <TabsTrigger value="stars" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-4">
                Stars
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cricketers" className="m-0">
              <div className="p-6">
                <div className='flex justify-between items-center mb-4'>
                    <h3 className="text-lg font-semibold">Cricketers</h3>
                    <div className="flex gap-2">
                      <CSVUpload
                        onUpload={handleCricketersCSVUpload}
                        title="Upload Cricketers CSV"
                        description="Upload multiple cricketers at once. CSV should have columns: name, country, roles (comma-separated), avatarUrl"
                        exampleHeaders={['name', 'country', 'roles', 'avatarUrl']}
                        buttonText="Upload CSV"
                        onDownloadTemplate={downloadCricketersTemplate}
                      />
                      <Button size="sm" asChild>
                        <Link href="/admin/fanzone/cricketers/new">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Cricketer
                        </Link>
                      </Button>
                    </div>
                </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cricketersLoading && (
                    <>
                        <TableRow>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                             <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                    </>
                  )}
                  {cricketers && cricketers.map((cricketer) => (
                    <TableRow key={cricketer.id}>
                      <TableCell>{cricketer.name}</TableCell>
                      <TableCell>{cricketer.country}</TableCell>
                      <TableCell>{cricketer.roles?.join(', ')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                           <Button variant="ghost" size="icon" asChild>
                             <Link href={`/admin/fanzone/cricketers/edit/${cricketer.id}`}>
                               <Edit className="w-4 h-4" />
                             </Link>
                           </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the profile for "{cricketer.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCricketer(cricketer.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!cricketersLoading && cricketers?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No cricketers found. Add one to get started.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </TabsContent>
            <TabsContent value="teams" className="m-0">
              <div className="p-6">
                <div className='flex justify-between items-center mb-4'>
                    <h3 className="text-lg font-semibold">Teams (IPL & National)</h3>
                    <div className="flex gap-2">
                      <CSVUpload
                        onUpload={handleTeamsCSVUpload}
                        title="Upload Teams CSV"
                        description="Upload multiple teams at once. CSV should have columns: name, type (ip/national), logoUrl"
                        exampleHeaders={['name', 'type', 'logoUrl']}
                        buttonText="Upload CSV"
                        onDownloadTemplate={downloadTeamsTemplate}
                      />
                      <Button size="sm" asChild>
                        <Link href="/admin/fanzone/teams/new">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Team
                        </Link>
                      </Button>
                    </div>
                </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                             {teamsLoading && (
                                <>
                                    <TableRow>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    </TableRow>
                                </>
                            )}
                            {teams && teams.map((team) => (
                                <TableRow key={team.id}>
                                    <TableCell>{team.name}</TableCell>
                                    <TableCell className="capitalize">{team.type}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/fanzone/teams/edit/${team.id}`}>
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the profile for "{team.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>
                                                        Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!teamsLoading && teams?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No teams found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
              </div>
            </TabsContent>
            <TabsContent value="movies" className="m-0">
              <div className="p-6">
                <div className='flex justify-between items-center mb-4'>
                    <h3 className="text-lg font-semibold">Movies</h3>
                    <div className="flex gap-2">
                      <CSVUpload
                        onUpload={handleMoviesCSVUpload}
                        title="Upload Movies CSV"
                        description="Upload multiple movies at once. CSV should have columns: title, releaseYear, genre, description, posterUrl"
                        exampleHeaders={['title', 'releaseYear', 'genre', 'description', 'posterUrl']}
                        buttonText="Upload CSV"
                        onDownloadTemplate={downloadMoviesTemplate}
                      />
                      <Button size="sm" asChild>
                        <Link href="/admin/fanzone/movies/new">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Movie
                        </Link>
                      </Button>
                    </div>
                </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Year</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                             {moviesLoading && (
                                <TableRow><TableCell colSpan={3}><Skeleton className="h-20" /></TableCell></TableRow>
                            )}
                            {movies && movies.map((movie) => (
                                <TableRow key={movie.id}>
                                    <TableCell>{movie.title}</TableCell>
                                    <TableCell>{movie.releaseYear}</TableCell>
                                    <TableCell>
                                         <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/fanzone/movies/edit/${movie.id}`}>
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{movie.title}".</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMovie(movie.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!moviesLoading && movies?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No movies found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
              </div>
            </TabsContent>
            <TabsContent value="stars" className="m-0">
              <div className="p-6">
                <div className='flex justify-between items-center mb-4'>
                    <h3 className="text-lg font-semibold">Stars</h3>
                    <div className="flex gap-2">
                      <CSVUpload
                        onUpload={handleStarsCSVUpload}
                        title="Upload Stars CSV"
                        description="Upload multiple stars at once. CSV should have columns: name, genre (comma-separated), avatar"
                        exampleHeaders={['name', 'genre', 'avatar']}
                        buttonText="Upload CSV"
                        onDownloadTemplate={downloadStarsTemplate}
                      />
                      <Button size="sm" asChild>
                        <Link href="/admin/fanzone/stars/new">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Star
                        </Link>
                      </Button>
                    </div>
                </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Genre</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                             {starsLoading && (
                                <TableRow><TableCell colSpan={3}><Skeleton className="h-20" /></TableCell></TableRow>
                            )}
                            {stars && stars.map((star) => (
                                <TableRow key={star.id}>
                                    <TableCell>{star.name}</TableCell>
                                    <TableCell>{star.genre.join(', ')}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                 <Link href={`/admin/fanzone/stars/edit/${star.id}`}>
                                                    <Edit className="w-4 h-4" />
                                                 </Link>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{star.name}".</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteStar(star.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!starsLoading && stars?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No stars found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
