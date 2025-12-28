'use client';

import { useEffect, useRef } from 'react';
import { useMatchEvents } from './use-match-events';
import { toast } from '@/hooks/use-toast';
import { Bell, Zap, Lock } from 'lucide-react';
import type { CricketEvent } from '@/lib/types';

type NotificationOptions = {
  matchId: string;
  enabled?: boolean;
  showBrowserNotifications?: boolean;
};

/**
 * Hook to notify users when events unlock or lock
 */
export function useEventNotifications({
  matchId,
  enabled = true,
  showBrowserNotifications = false,
}: NotificationOptions) {
  const { eventsByStatus, currentPhase, matchState } = useMatchEvents(matchId);
  const previousLiveEvents = useRef<Set<string>>(new Set());
  const previousPhase = useRef<string>('');

  // Request browser notification permission
  useEffect(() => {
    if (showBrowserNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [showBrowserNotifications]);

  // Notify when new events unlock
  useEffect(() => {
    if (!enabled || !eventsByStatus.live) return;

    const currentLiveEventIds = new Set(eventsByStatus.live.map(e => e.id));
    const newEvents = eventsByStatus.live.filter(
      e => !previousLiveEvents.current.has(e.id)
    );

    if (newEvents.length > 0) {
      newEvents.forEach(event => {
        // Show toast notification
        toast({
          title: '🎯 New Event Unlocked!',
          description: `${event.title} is now available for predictions.`,
          duration: 5000,
        });

        // Show browser notification if enabled
        if (showBrowserNotifications && Notification.permission === 'granted') {
          new Notification('New Event Unlocked!', {
            body: `${event.title} is now available for predictions.`,
            icon: '/icon-192x192.png',
            tag: `event-${event.id}`,
          });
        }
      });
    }

    previousLiveEvents.current = currentLiveEventIds;
  }, [eventsByStatus.live, enabled, showBrowserNotifications]);

  // Notify when phase changes
  useEffect(() => {
    if (!enabled || !currentPhase || previousPhase.current === currentPhase) return;

    if (previousPhase.current && previousPhase.current !== 'Pre-Match') {
      toast({
        title: '📊 Phase Changed',
        description: `Match has moved to ${currentPhase}. New events may be available.`,
        duration: 4000,
      });

      if (showBrowserNotifications && Notification.permission === 'granted') {
        new Notification('Match Phase Changed', {
          body: `Match has moved to ${currentPhase}.`,
          icon: '/icon-192x192.png',
        });
      }
    }

    previousPhase.current = currentPhase;
  }, [currentPhase, enabled, showBrowserNotifications]);

  // Notify when events are about to lock (5 overs before)
  useEffect(() => {
    if (!enabled || !matchState || !eventsByStatus.live) return;

    const { currentOver, format } = matchState;
    const maxOvers = format === 'T20' || format === 'IPL' ? 20 : format === 'ODI' ? 50 : 90;

    eventsByStatus.live.forEach(event => {
      // Check if event is in current phase and approaching lock
      const phaseOver = currentOver % maxOvers;
      
      // Notify 5 overs before phase ends
      if (format === 'T20' || format === 'IPL') {
        if (phaseOver === 1 && currentPhase.includes('Powerplay')) {
          toast({
            title: '⏰ Events Locking Soon',
            description: 'Powerplay events will lock after Over 6. Make your predictions now!',
            duration: 6000,
          });
        } else if (phaseOver === 10 && currentPhase.includes('Middle')) {
          toast({
            title: '⏰ Events Locking Soon',
            description: 'Middle overs events will lock after Over 15. Make your predictions now!',
            duration: 6000,
          });
        }
      }
    });
  }, [matchState, eventsByStatus.live, currentPhase, enabled]);

  return {
    liveEventsCount: eventsByStatus.live?.length || 0,
    upcomingEventsCount: eventsByStatus.upcoming?.length || 0,
  };
}

