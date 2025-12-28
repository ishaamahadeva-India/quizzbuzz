'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import { doc, collection, onSnapshot, Timestamp } from 'firebase/firestore';
import type { FantasyMatch, CricketEvent } from '@/lib/types';
import {
  getCurrentMatchPhase,
  getUnlockedEvents,
  getEventStatus,
  getLockedEvents,
  getEventsForPhase,
  type MatchState,
  type MatchPhase,
  CRICKET_EVENT_TEMPLATES,
} from '@/firebase/firestore/cricket-matches';

/**
 * Custom hook to manage match state and sequential event unlocking
 */
export function useMatchEvents(matchId: string) {
  const firestore = useFirestore();
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [currentPhase, setCurrentPhase] = useState<MatchPhase>('Pre-Match');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch match data
  const matchRef = firestore ? doc(firestore, 'fantasy_matches', matchId) : null;
  const { data: match } = useDoc(matchRef);

  // Fetch events
  const eventsRef = firestore
    ? collection(firestore, 'fantasy_matches', matchId, 'events')
    : null;
  const { data: eventsData } = useCollection(eventsRef);
  
  // Transform events data to CricketEvent type
  const events = useMemo(() => {
    if (!eventsData) return [];
    return eventsData.map((eventData) => {
      const data = eventData as any;
      return {
        id: eventData.id,
        title: data.title || '',
        description: data.description || '',
        eventType: data.eventType,
        matchId: data.matchId || matchId,
        innings: data.innings,
        status: data.status || 'upcoming',
        startTime: data.startTime?.toDate?.() || data.startTime,
        endTime: data.endTime?.toDate?.() || data.endTime,
        lockTime: data.lockTime?.toDate?.() || data.lockTime,
        points: data.points || 0,
        difficultyLevel: data.difficultyLevel,
        options: data.options,
        rules: data.rules,
        result: data.result,
        applicableFormats: data.applicableFormats,
        category: data.category,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      } as CricketEvent;
    });
  }, [eventsData, matchId]);

  // Set up real-time listener for match state updates
  useEffect(() => {
    if (!firestore || !matchId) return;

    const matchDocRef = doc(firestore, 'fantasy_matches', matchId);
    
    const unsubscribe = onSnapshot(matchDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const matchData = snapshot.data();
        
        // Extract match state from match data
        // Assuming match has: currentOver, currentInnings, matchStatus, currentDay, isInningsBreak
        const state: MatchState = {
          format: matchData.format || 'T20',
          currentOver: matchData.currentOver || 0,
          currentInnings: matchData.currentInnings || 1,
          matchStatus: matchData.status || 'upcoming',
          currentDay: matchData.currentDay,
          isInningsBreak: matchData.isInningsBreak || false,
        };

        setMatchState(state);
        const phase = getCurrentMatchPhase(state);
        setCurrentPhase(phase);
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error listening to match updates:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, matchId]);

  // Initialize match state from match data
  useEffect(() => {
    if (match && !matchState) {
      const state: MatchState = {
        format: (match.format as 'T20' | 'ODI' | 'Test' | 'IPL') || 'T20',
        currentOver: (match as any).currentOver || 0,
        currentInnings: ((match as any).currentInnings as 1 | 2) || 1,
        matchStatus: match.status || 'upcoming',
        currentDay: (match as any).currentDay,
        isInningsBreak: (match as any).isInningsBreak || false,
      };

      setMatchState(state);
      const phase = getCurrentMatchPhase(state);
      setCurrentPhase(phase);
      setIsLoading(false);
    }
  }, [match, matchState]);

  // Get unlocked event templates
  const unlockedEventTemplates = useMemo(() => {
    if (!matchState) return [];
    return getUnlockedEvents(matchState);
  }, [matchState]);

  // Get locked event templates
  const lockedEventTemplates = useMemo(() => {
    if (!matchState) return [];
    return getLockedEvents(matchState);
  }, [matchState]);

  // Get events for current phase
  const currentPhaseEvents = useMemo(() => {
    return getEventsForPhase(currentPhase);
  }, [currentPhase]);

  // Group events by status
  const eventsByStatus = useMemo(() => {
    if (!events || !matchState) {
      return {
        upcoming: [],
        live: [],
        locked: [],
        completed: [],
      };
    }

    const grouped = {
      upcoming: [] as CricketEvent[],
      live: [] as CricketEvent[],
      locked: [] as CricketEvent[],
      completed: [] as CricketEvent[],
    };

    events.forEach((event) => {
      // Find matching template
      const template = CRICKET_EVENT_TEMPLATES.find(
        (t) => t.eventType === event.eventType && t.title === event.title
      );

      if (template) {
        const status = getEventStatus(template, matchState);
        
        // Use template status if event doesn't have explicit status
        const eventStatus = event.status || status;

        switch (eventStatus) {
          case 'upcoming':
            grouped.upcoming.push(event);
            break;
          case 'live':
            grouped.live.push(event);
            break;
          case 'locked':
            grouped.locked.push(event);
            break;
          case 'completed':
            grouped.completed.push(event);
            break;
        }
      } else {
        // Fallback to event's own status
        switch (event.status) {
          case 'upcoming':
            grouped.upcoming.push(event);
            break;
          case 'live':
            grouped.live.push(event);
            break;
          case 'locked':
            grouped.locked.push(event);
            break;
          case 'completed':
            grouped.completed.push(event);
            break;
        }
      }
    });

    return grouped;
  }, [events, matchState]);

  // Group events by phase
  const eventsByPhase = useMemo(() => {
    if (!events) return {};

    const grouped: Record<string, CricketEvent[]> = {};

    events.forEach((event) => {
      const template = CRICKET_EVENT_TEMPLATES.find(
        (t) => t.eventType === event.eventType && t.title === event.title
      );

      const phase = template?.matchPhase || 'Pre-Match';
      if (!grouped[phase]) {
        grouped[phase] = [];
      }
      grouped[phase].push(event);
    });

    return grouped;
  }, [events]);

  return {
    matchState,
    currentPhase,
    match,
    events,
    unlockedEventTemplates,
    lockedEventTemplates,
    currentPhaseEvents,
    eventsByStatus,
    eventsByPhase,
    isLoading,
  };
}

