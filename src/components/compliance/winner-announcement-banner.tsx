'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Info } from 'lucide-react';

interface WinnerAnnouncementBannerProps {
  className?: string;
}

export function WinnerAnnouncementBanner({ className }: WinnerAnnouncementBannerProps) {
  return (
    <Card className={`bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2 text-sm">
            <p className="font-semibold text-green-900 dark:text-green-100">
              🏆 Congratulations!
            </p>
            <div className="space-y-1 text-green-800 dark:text-green-200">
              <p>Prizes are non-cash and sponsor-funded.</p>
              <p>Winners will be notified via in-app notification or email.</p>
              <p>Prizes must be claimed within 60 days, or they will be forfeited.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

