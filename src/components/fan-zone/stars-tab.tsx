
'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import type { Star } from '@/lib/types';


function FollowButton({ starId }: { starId: string }) {
    const [isFollowing, setIsFollowing] = useState(false);

    const handleFollow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFollowing(!isFollowing);
    };

    return (
        <Button 
            variant={isFollowing ? 'secondary' : 'outline'} 
            size="sm" 
            className="w-full text-xs"
            onClick={handleFollow}
        >
            {isFollowing ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isFollowing ? 'Following' : 'Follow'}
        </Button>
    );
}

export function StarsTab({ searchTerm }: { searchTerm: string }) {
  const firestore = useFirestore();
  const starsQuery = firestore ? collection(firestore, 'stars') : null;
  const { data: stars, isLoading } = useCollection(starsQuery);

  const filteredStars =
    stars
      ?.filter((star) =>
        star.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                         <Skeleton className="h-8 w-full rounded-full mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
      )
  }

  if (filteredStars.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No stars found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredStars.map((star) => (
        <Link href={`/fan-zone/star/${star.id}`} key={star.id} className="group">
          <Card className="h-full hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex flex-col gap-2 h-full">
              <h3 className="font-bold font-headline text-base group-hover:text-primary">
                {star.name}
              </h3>
              <div className="space-y-1 flex-1">
                {star.profession && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Profession:</span> {star.profession}
                  </p>
                )}
                {star.industry && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Industry:</span> {star.industry}
                  </p>
                )}
                {star.genre && star.genre.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Genre:</span> {star.genre.join(', ')}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <FollowButton starId={star.id} />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
