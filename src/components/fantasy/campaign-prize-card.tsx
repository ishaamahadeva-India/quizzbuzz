'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PrizeTable } from '@/components/fantasy/prize-table';
import { useMemo } from 'react';
import type { FantasyCampaign } from '@/lib/types';

type FantasyCampaignWithId = FantasyCampaign & { id: string };

interface CampaignPrizeCardProps {
  campaign: FantasyCampaignWithId;
}

export function CampaignPrizeCard({ campaign }: CampaignPrizeCardProps) {
  const firestore = useFirestore();

  // Fetch participant count for this campaign
  const participationsRef = firestore
    ? collection(firestore, 'fantasy-campaigns', campaign.id, 'participations')
    : null;
  const { data: participations } = useCollection(participationsRef);
  const participantCount = participations?.length || 0;

  if (!campaign.prizeDistribution) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle className="text-2xl font-headline">{campaign.title}</CardTitle>
            </div>
            {campaign.description && (
              <CardDescription className="mt-1">{campaign.description}</CardDescription>
            )}
            {campaign.prizeDistribution?.totalPrizePool && (
              <Badge variant="secondary" className="mt-2 text-base px-3 py-1">
                Sponsored Rewards Pool: ₹{campaign.prizeDistribution.totalPrizePool.toLocaleString('en-IN')}
              </Badge>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/fantasy/campaign/${campaign.id}`}>
              View Campaign
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <PrizeTable
          prizeDistribution={campaign.prizeDistribution}
          participantCount={participantCount}
          campaignTitle={campaign.title}
        />
      </CardContent>
    </Card>
  );
}

