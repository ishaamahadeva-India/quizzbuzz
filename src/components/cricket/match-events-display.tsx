'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Lock, CheckCircle, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import type { CricketEvent } from '@/lib/types';
import type { MatchPhase, MatchState } from '@/firebase/firestore/cricket-matches';
import { cn } from '@/lib/utils';
import { EventCountdown } from './event-countdown';

type MatchEventsDisplayProps = {
  events: CricketEvent[];
  eventsByStatus: {
    upcoming: CricketEvent[];
    live: CricketEvent[];
    locked: CricketEvent[];
    completed: CricketEvent[];
  };
  eventsByPhase: Record<string, CricketEvent[]>;
  currentPhase: MatchPhase;
  matchState?: MatchState | null;
  matchFormat?: 'T20' | 'ODI' | 'Test' | 'IPL';
  onEventClick?: (event: CricketEvent) => void;
};

const phaseLabels: Record<string, string> = {
  'Pre-Match': 'Pre-Match',
  'First Innings - Powerplay (Overs 1-6)': '1st Innings Powerplay',
  'First Innings - Middle Overs (Overs 7-15)': '1st Innings Middle Overs',
  'First Innings - Death Overs (Overs 16-20)': '1st Innings Death Overs',
  'Innings Break': 'Innings Break',
  'Second Innings - Powerplay (Overs 1-6)': '2nd Innings Powerplay',
  'Second Innings - Middle Overs (Overs 7-15)': '2nd Innings Middle Overs',
  'Second Innings - Death Overs (Overs 16-20)': '2nd Innings Death Overs',
  'Post-Match': 'Post-Match',
  // ODI phases
  'First Innings - Powerplay 1 (Overs 1-10)': '1st Innings Powerplay 1',
  'First Innings - Middle Overs (Overs 11-40)': '1st Innings Middle Overs',
  'First Innings - Powerplay 2 (Overs 41-50)': '1st Innings Powerplay 2',
  'Second Innings - Powerplay 1 (Overs 1-10)': '2nd Innings Powerplay 1',
  'Second Innings - Middle Overs (Overs 11-40)': '2nd Innings Middle Overs',
  'Second Innings - Powerplay 2 (Overs 41-50)': '2nd Innings Powerplay 2',
};

const statusConfig = {
  upcoming: {
    label: 'Upcoming',
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  live: {
    label: 'Live',
    icon: Zap,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  locked: {
    label: 'Locked',
    icon: Lock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
};

export function MatchEventsDisplay({
  events,
  eventsByStatus,
  eventsByPhase,
  currentPhase,
  matchState,
  matchFormat = 'T20',
  onEventClick,
}: MatchEventsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'phase'>('status');

  const EventCard = ({ event }: { event: CricketEvent }) => {
    const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.live;
    const Icon = config.icon;

    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          config.bgColor,
          config.borderColor,
          'border-2',
          event.status === 'locked' && 'opacity-60'
        )}
        onClick={() => onEventClick?.(event)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{event.title}</CardTitle>
              <CardDescription className="mt-1 text-sm">
                {event.description}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn('ml-2', config.color, config.borderColor)}
            >
              <Icon className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{event.points} pts</Badge>
              {event.difficultyLevel && (
                <Badge variant="outline" className="text-xs">
                  {event.difficultyLevel}
                </Badge>
              )}
            </div>
            {event.status === 'live' && (
              <div className="flex items-center gap-2">
                {matchState && (
                  <EventCountdown
                    event={event}
                    matchState={matchState}
                    format={matchFormat}
                  />
                )}
                <Button size="sm" variant="default">
                  Predict Now
                </Button>
              </div>
            )}
            {event.status === 'locked' && (
              <Button size="sm" variant="outline" disabled>
                <Lock className="mr-1 h-3 w-3" />
                Locked
              </Button>
            )}
            {event.status === 'completed' && event.result && (
              <Badge variant="outline" className="text-xs">
                Result: {event.result.outcome}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Match Events</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Current Phase: <span className="font-semibold">{phaseLabels[currentPhase] || currentPhase}</span>
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {events.length} Total Events
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'status' | 'phase')}>
        <TabsList>
          <TabsTrigger value="status">
            By Status ({eventsByStatus.live.length} live)
          </TabsTrigger>
          <TabsTrigger value="phase">By Phase</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6 mt-4">
          {/* Live Events */}
          {eventsByStatus.live.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold text-lg">Live Events ({eventsByStatus.live.length})</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsByStatus.live.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {eventsByStatus.upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-lg">Upcoming Events ({eventsByStatus.upcoming.length})</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsByStatus.upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Locked Events */}
          {eventsByStatus.locked.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-lg">Locked Events ({eventsByStatus.locked.length})</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsByStatus.locked.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Events */}
          {eventsByStatus.completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-lg">Completed Events ({eventsByStatus.completed.length})</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsByStatus.completed.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events available for this match.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="phase" className="space-y-6 mt-4">
          {Object.entries(eventsByPhase).map(([phase, phaseEvents]) => (
            <div key={phase}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-lg">
                  {phaseLabels[phase] || phase} ({phaseEvents.length})
                </h3>
                {phase === currentPhase && (
                  <Badge variant="default" className="ml-2">
                    Current
                  </Badge>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {phaseEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}

          {Object.keys(eventsByPhase).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events available for this match.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

