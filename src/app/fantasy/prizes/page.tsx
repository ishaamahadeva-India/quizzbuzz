'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowRight, Ticket, Info } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import type { FantasyCampaign } from '@/lib/types';
import { CampaignPrizeCard } from '@/components/fantasy/campaign-prize-card';

type FantasyCampaignWithId = FantasyCampaign & { id: string };

export default function AllPrizesPage() {
  const firestore = useFirestore();

  // Fetch all campaigns with prize distribution
  const campaignsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'fantasy-campaigns'),
      where('prizeDistribution', '!=', null)
    );
  }, [firestore]);

  const { data: campaignsData, isLoading } = useCollection(campaignsQuery);
  const campaigns = campaignsData as FantasyCampaignWithId[] | undefined;

  // Filter campaigns that actually have prizeDistribution
  const campaignsWithPrizes = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter(campaign => campaign.prizeDistribution && campaign.prizeDistribution.tiers.length > 0);
  }, [campaigns]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Prize Distributions</h1>
        </div>
        <p className="text-muted-foreground">
          View prize tiers and rewards for all active fantasy campaigns
        </p>
      </div>

      {/* Campaigns List */}
      {campaignsWithPrizes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-semibold">No Prize Distributions Available</h3>
                <p className="text-muted-foreground mt-2">
                  There are no campaigns with prize distributions configured yet.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/fantasy/movie">
                  Browse Campaigns
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {campaignsWithPrizes.map((campaign) => (
            <CampaignPrizeCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Compliance Disclosure Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Prize & Participation Disclosure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-base">This is a FREE skill-based contest.</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
              <li>No entry fee or payment is required to participate.</li>
              <li>All prizes are non-cash promotional rewards.</li>
              <li>Prizes are fully funded by sponsors and partners.</li>
              <li>Participation or ranking does not involve any monetary risk.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">Winners are determined based solely on skill, knowledge, and performance.</p>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">🎯 Prize Nature</h4>
            <p className="text-muted-foreground">Prizes are non-transferable, non-exchangeable, and not redeemable for cash. Prizes may include merchandise, experiences, tickets, subscriptions, or other sponsor-provided rewards.</p>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">📍 Eligibility</h4>
            <p className="text-muted-foreground">Open to residents of India aged 18 years and above. Certain rewards may be subject to sponsor-specific eligibility criteria.</p>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">⏰ Distribution</h4>
            <p className="text-muted-foreground">Prizes will be distributed within 30 days of campaign completion. Winners will be notified via in-app notification and/or email.</p>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">📜 Legal</h4>
            <p className="text-muted-foreground">This is a promotional skill-based activity and does not constitute gambling or betting. Participation is subject to the Platform Terms & Conditions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

