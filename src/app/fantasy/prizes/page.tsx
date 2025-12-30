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

      {/* Mandatory Compliance Disclosures */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Prize & Participation Disclosures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {/* 1. Free Participation Disclosure */}
          <div className="space-y-2">
            <h4 className="font-semibold text-base">1. Free Participation</h4>
            <p className="text-muted-foreground">
              This is a FREE skill-based contest. No entry fee or payment is required to participate.
            </p>
          </div>

          {/* 2. Non-Cash Prize Disclosure */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">2. Non-Cash Rewards</h4>
            <p className="text-muted-foreground">
              All prizes are non-cash promotional rewards. Prizes are not redeemable for cash, wallet balance, or bank transfer.
            </p>
          </div>

          {/* 3. Sponsor-Funded Rewards Disclosure */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">3. Sponsor-Funded Rewards</h4>
            <p className="text-muted-foreground">
              All prizes are fully funded by sponsors and partners. No user payments are used to fund rewards.
            </p>
          </div>

          {/* 4. Skill-Based Outcome Disclosure */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">4. Skill-Based Outcome</h4>
            <p className="text-muted-foreground">
              Winners are determined based on skill, knowledge, and performance. No element of chance or luck determines the outcome.
            </p>
          </div>

          {/* 5. No Gambling / Betting Disclaimer */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">5. No Gambling or Betting</h4>
            <p className="text-muted-foreground">
              This platform does not offer gambling, betting, or wagering of any kind.
            </p>
          </div>

          {/* 6. Eligibility */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">6. Eligibility</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Open to residents of India</li>
              <li>Participants must be 18 years or older</li>
              <li>Employees of sponsors and their immediate family members are not eligible</li>
            </ul>
          </div>

          {/* 7. Prize Nature & Limitations */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">7. Prize Nature & Limitations</h4>
            <p className="text-muted-foreground">
              Prizes are non-transferable, non-exchangeable, and subject to availability. The platform reserves the right to substitute a prize of equal or greater value.
            </p>
          </div>

          {/* 8. Prize Distribution Timeline */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">8. Prize Distribution Timeline</h4>
            <p className="text-muted-foreground">
              Prizes will be distributed within 30 days of contest completion. Winners will be notified via in-app notification and/or email.
            </p>
          </div>

          {/* 9. Tax Disclaimer */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">9. Tax Disclaimer</h4>
            <p className="text-muted-foreground">
              Any personal tax liability arising from receiving a prize, if applicable, is the sole responsibility of the winner.
            </p>
          </div>

          {/* 10. Fair Play & Disqualification */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">10. Fair Play & Disqualification</h4>
            <p className="text-muted-foreground">
              The platform reserves the right to disqualify participants for fraud, misuse, or violation of rules. All decisions of the platform shall be final and binding.
            </p>
          </div>

          {/* 11. Terms & Conditions Reference */}
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-semibold">11. Terms & Conditions</h4>
            <p className="text-muted-foreground">
              Participation in any contest implies acceptance of the{' '}
              <Link href="/terms" className="text-primary hover:underline font-medium">
                Platform Terms & Conditions
              </Link>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

