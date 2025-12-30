'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowRight, Ticket, Info, Gift, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">
            🎉 Free Skill-Based Contests – Sponsor-Funded Rewards
          </h1>
        </div>
        
        {/* Intro Text */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              All contests on QuizzBuzz are <strong className="font-bold">FREE</strong> to play and skill-based.
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              No entry fees are collected, and <strong className="font-semibold">no cash prizes</strong> are offered.
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              Prizes are sponsored and provided as promotional rewards.
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              Your participation is purely for entertainment, recognition, and fun.
            </p>
          </CardContent>
        </Card>
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
          {/* Prize Table Section Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold font-headline">🏅 Contest Rewards</h2>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 ml-8">
              <p>• Rewards are non-cash and non-transferable</p>
              <p>• Prizes may include merchandise, tickets, subscriptions, or experiences</p>
              <p>• Prize images are illustrative and may vary</p>
            </div>
          </div>

          {campaignsWithPrizes.map((campaign) => (
            <CampaignPrizeCard key={campaign.id} campaign={campaign} />
          ))}

          {/* Tier Explanation */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg">Prize Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Prize tiers are determined by final leaderboard rankings. Examples include:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong className="text-foreground">Rank 1:</strong> Sponsored Merchandise Pack</li>
                <li><strong className="text-foreground">Rank 2–5:</strong> Gift Vouchers / Coupons</li>
                <li><strong className="text-foreground">Rank 6–10:</strong> Digital Rewards / Experiences</li>
              </ul>
              <p className="mt-2">
                Minimum participants required for each tier are indicated above.
              </p>
              <p>
                Rewards will be distributed within 30 days after contest completion.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Eligibility & Fair Play Notice */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Shield className="w-5 h-5" />
            Eligibility & Fair Play
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Eligibility:</h4>
            <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200 ml-2">
              <li>Open to residents of India</li>
              <li>Participants must be 18+ years old</li>
              <li>Employees of QuizzBuzz or sponsors, and their immediate family, are not eligible</li>
            </ul>
          </div>
          <div className="border-t border-amber-300 dark:border-amber-700 pt-4">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Fair Play:</h4>
            <p className="text-amber-800 dark:text-amber-200">
              Any fraudulent activity, cheating, or misuse may result in disqualification. Decisions by QuizzBuzz are final and binding.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sponsor Funding Disclaimer */}
      <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm text-purple-900 dark:text-purple-100">
              <p className="font-semibold">Sponsor Funding Disclaimer</p>
              <p className="text-purple-800 dark:text-purple-200">
                All prizes are fully funded by sponsors. No participant payment is used to fund rewards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Disclaimer */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold">Tax Disclaimer</p>
              <p className="text-blue-800 dark:text-blue-200">
                Any personal tax obligations arising from receiving a prize, if applicable, are the responsibility of the winner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions Reference */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                Participation in any contest implies acceptance of the{' '}
                <Link href="/terms" className="text-primary hover:underline font-medium">
                  Platform Terms & Conditions
                </Link>.
              </p>
              <p className="text-xs text-muted-foreground">
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                {' • '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Age & Safety Reminder */}
      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm text-red-900 dark:text-red-100">
              <p className="font-semibold">Age & Safety Reminder</p>
              <p className="text-red-800 dark:text-red-200">
                Participants must be 18+ years old. Minors are not eligible to participate in any contests or claim rewards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Short Copy */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="p-4">
          <p className="text-xs text-center text-muted-foreground font-medium">
            Free contests | Skill-based | Sponsor-funded non-cash rewards | No entry fee | No cash prizes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

