'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Gift } from 'lucide-react';

interface SponsorCampaignBannerProps {
  sponsorName?: string;
  className?: string;
}

export function SponsorCampaignBanner({ sponsorName, className }: SponsorCampaignBannerProps) {
  if (!sponsorName) return null;

  return (
    <Card className={`bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
              🎁 Sponsored Contest
            </p>
            <p className="text-purple-800 dark:text-purple-200">
              All rewards for this contest are fully funded by <strong>{sponsorName}</strong>. No cash is involved and participation is free.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

