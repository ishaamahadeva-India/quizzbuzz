'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Zap } from 'lucide-react';
import type { MatchPhase, MatchState } from '@/firebase/firestore/cricket-matches';
import { cn } from '@/lib/utils';

type MatchPhaseIndicatorProps = {
  currentPhase: MatchPhase;
  matchState: MatchState | null;
  className?: string;
};

const phaseConfig: Record<string, { label: string; color: string; icon: any }> = {
  'Pre-Match': {
    label: 'Pre-Match',
    color: 'bg-blue-500',
    icon: Clock,
  },
  'First Innings - Powerplay (Overs 1-6)': {
    label: '1st Innings Powerplay',
    color: 'bg-green-500',
    icon: Zap,
  },
  'First Innings - Middle Overs (Overs 7-15)': {
    label: '1st Innings Middle Overs',
    color: 'bg-yellow-500',
    icon: TrendingUp,
  },
  'First Innings - Death Overs (Overs 16-20)': {
    label: '1st Innings Death Overs',
    color: 'bg-orange-500',
    icon: Zap,
  },
  'Innings Break': {
    label: 'Innings Break',
    color: 'bg-purple-500',
    icon: Clock,
  },
  'Second Innings - Powerplay (Overs 1-6)': {
    label: '2nd Innings Powerplay',
    color: 'bg-green-500',
    icon: Zap,
  },
  'Second Innings - Middle Overs (Overs 7-15)': {
    label: '2nd Innings Middle Overs',
    color: 'bg-yellow-500',
    icon: TrendingUp,
  },
  'Second Innings - Death Overs (Overs 16-20)': {
    label: '2nd Innings Death Overs',
    color: 'bg-orange-500',
    icon: Zap,
  },
  'Post-Match': {
    label: 'Post-Match',
    color: 'bg-gray-500',
    icon: Clock,
  },
  // ODI phases
  'First Innings - Powerplay 1 (Overs 1-10)': {
    label: '1st Innings Powerplay 1',
    color: 'bg-green-500',
    icon: Zap,
  },
  'First Innings - Middle Overs (Overs 11-40)': {
    label: '1st Innings Middle Overs',
    color: 'bg-yellow-500',
    icon: TrendingUp,
  },
  'First Innings - Powerplay 2 (Overs 41-50)': {
    label: '1st Innings Powerplay 2',
    color: 'bg-orange-500',
    icon: Zap,
  },
  'Second Innings - Powerplay 1 (Overs 1-10)': {
    label: '2nd Innings Powerplay 1',
    color: 'bg-green-500',
    icon: Zap,
  },
  'Second Innings - Middle Overs (Overs 11-40)': {
    label: '2nd Innings Middle Overs',
    color: 'bg-yellow-500',
    icon: TrendingUp,
  },
  'Second Innings - Powerplay 2 (Overs 41-50)': {
    label: '2nd Innings Powerplay 2',
    color: 'bg-orange-500',
    icon: Zap,
  },
};

export function MatchPhaseIndicator({
  currentPhase,
  matchState,
  className,
}: MatchPhaseIndicatorProps) {
  const config = phaseConfig[currentPhase] || {
    label: currentPhase,
    color: 'bg-gray-500',
    icon: Clock,
  };

  const Icon = config.icon;

  const getOverInfo = () => {
    if (!matchState) return null;

    const { currentOver, currentInnings, format } = matchState;

    if (format === 'T20' || format === 'IPL') {
      if (currentInnings === 1) {
        return `Over ${currentOver}/20`;
      } else {
        const secondInningsOver = currentOver - 20;
        return `Over ${secondInningsOver}/20 (2nd Innings)`;
      }
    } else if (format === 'ODI') {
      if (currentInnings === 1) {
        return `Over ${currentOver}/50`;
      } else {
        const secondInningsOver = currentOver - 50;
        return `Over ${secondInningsOver}/50 (2nd Innings)`;
      }
    } else if (format === 'Test') {
      const day = matchState.currentDay || 1;
      const dayOver = ((day - 1) * 90) + currentOver;
      return `Day ${day}, Over ${dayOver}`;
    }

    return null;
  };

  return (
    <Card className={cn('border-2', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.color, 'text-white')}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{config.label}</h3>
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              </div>
              {getOverInfo() && (
                <p className="text-sm text-muted-foreground mt-1">
                  {getOverInfo()}
                </p>
              )}
            </div>
          </div>
          {matchState && (
            <div className="text-right">
              <div className="text-sm font-medium">
                {matchState.format} Match
              </div>
              <div className="text-xs text-muted-foreground">
                Innings {matchState.currentInnings}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

