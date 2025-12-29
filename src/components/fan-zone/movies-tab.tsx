
'use client';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import type { Movie } from '@/lib/types';
import { useMemo } from 'react';

export function MoviesTab({ searchTerm, industry }: { searchTerm: string, industry?: Movie['industry'] }) {
  const firestore = useFirestore();
  
  const moviesQuery = useMemo(() => {
    if (!firestore) return null;
    const moviesCollection = collection(firestore, 'movies');
    if (industry) {
      return query(moviesCollection, where('industry', '==', industry));
    }
    return collection(firestore, 'movies');
  }, [firestore, industry]);

  const { data: movies, isLoading } = useCollection(moviesQuery);

  const filteredMovies =
    movies
      ?.filter((movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];
      
  if (isLoading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4 flex flex-col gap-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  if (filteredMovies.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No movies found in this category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredMovies.map((movie) => (
        <Link href={`/fan-zone/movie/${movie.id}`} key={movie.id} className="group">
          <Card className="h-full hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex flex-col gap-2 h-full">
              <h3 className="font-bold font-headline text-base group-hover:text-primary">
                {movie.title}
              </h3>
              <div className="space-y-1 flex-1">
                {movie.releaseYear && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Year:</span> {movie.releaseYear}
                  </p>
                )}
                {movie.industry && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Industry:</span> {movie.industry}
                  </p>
                )}
                {movie.genre && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Genre:</span> {movie.genre}
                  </p>
                )}
                {movie.language && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Language:</span> {movie.language}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

    