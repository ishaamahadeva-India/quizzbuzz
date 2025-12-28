'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { getEventLockOver } from '@/firebase/firestore/cricket-matches';
import type { MatchState } from '@/firebase/firestore/cricket-matches';
import type { CricketEvent } from '@/lib/types';
import { CRICKET_EVENT_TEMPLATES } from '@/firebase/firestore/cricket-matches';

type EventCountdownProps = {
  event: CricketEvent;
  matchState: MatchState | null;
  format: 'T20' | 'ODI' | 'Test' | 'IPL';
};

/**
 * Component that displays countdown timer for when an event will lock
 */
export function EventCountdown({ event, matchState, format }: EventCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!matchState || event.status !== 'live') {
      setTimeRemaining('');
      return;
    }

    // Find matching template
    const template = CRICKET_EVENT_TEMPLATES.find(
      (t) => t.eventType === event.eventType && t.title === event.title
    );

    if (!template) {
      setTimeRemaining('');
      return;
    }

    const lockOver = getEventLockOver(template, format);
    if (lockOver === null) {
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      const currentOver = matchState.currentOver;
      const oversRemaining = lockOver - currentOver;

      if (oversRemaining <= 0) {
        setTimeRemaining('Locked');
        setIsUrgent(false);
        return;
      }

      // Estimate time per over (assuming ~4 minutes per over)
      const minutesPerOver = 4;
      const totalMinutes = oversRemaining * minutesPerOver;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }

      // Show urgent warning if less than 2 overs remaining
      setIsUrgent(oversRemaining <= 2);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [event, matchState, format]);

  if (!timeRemaining || event.status !== 'live') {
    return null;
  }

  return (
    <Badge
      variant={isUrgent ? 'destructive' : 'outline'}
      className="flex items-center gap-1 text-xs"
    >
      <Clock className="h-3 w-3" />
      {timeRemaining} left
    </Badge>
  );
}

