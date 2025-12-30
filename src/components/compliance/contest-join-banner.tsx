'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContestJoinBannerProps {
  className?: string;
}

export function ContestJoinBanner({ className }: ContestJoinBannerProps) {
  return (
    <Card className={`bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
              ⚠️ FREE & SKILL-BASED
            </p>
            <p className="text-amber-800 dark:text-amber-200">
              No entry fee required. All prizes are non-cash and sponsored. Participation is purely for fun and skill recognition.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PrizeInfoTooltipProps {
  children: React.ReactNode;
}

export function PrizeInfoTooltip({ children }: PrizeInfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold">ℹ️ Prize Information</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Minimum participant requirement applies for each tier.</li>
              <li>Prizes will be distributed within 30 days after contest completion.</li>
              <li>All prizes are non-cash, non-transferable, and sponsor-funded.</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

