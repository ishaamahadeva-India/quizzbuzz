'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { incrementOver, startMatch, startInningsBreak, startSecondInnings, completeMatch } from '@/lib/match-state-utils';
import { toast } from '@/hooks/use-toast';
import type { MatchState } from '@/firebase/firestore/cricket-matches';

type MatchTrackingOptions = {
  matchId: string;
  format: 'T20' | 'ODI' | 'Test' | 'IPL';
  autoIncrement?: boolean; // Auto-increment overs (for testing/demo)
  incrementInterval?: number; // Interval in seconds for auto-increment
};

/**
 * Hook for tracking match progress and updating match state
 * Can be used with real match data or for testing/demo purposes
 */
export function useMatchTracking({
  matchId,
  format,
  autoIncrement = false,
  incrementInterval = 60, // 1 minute per over (for demo)
}: MatchTrackingOptions) {
  const firestore = useFirestore();
  const [isTracking, setIsTracking] = useState(false);
  const [currentOver, setCurrentOver] = useState(0);
  const [currentInnings, setCurrentInnings] = useState(1);

  // Auto-increment overs for demo/testing
  useEffect(() => {
    if (!autoIncrement || !isTracking || !firestore) return;

    const interval = setInterval(async () => {
      try {
        await handleOverComplete();
      } catch (error) {
        console.error('Error auto-incrementing over:', error);
      }
    }, incrementInterval * 1000);

    return () => clearInterval(interval);
  }, [autoIncrement, isTracking, firestore, incrementInterval]);

  /**
   * Start the match
   */
  const handleMatchStart = useCallback(async () => {
    if (!firestore) return;

    try {
      await startMatch(firestore, matchId);
      setCurrentOver(0);
      setCurrentInnings(1);
      setIsTracking(true);

      toast({
        title: 'Match Started',
        description: 'The match has begun! Events are now unlocking.',
      });
    } catch (error) {
      console.error('Error starting match:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start match.',
      });
    }
  }, [firestore, matchId]);

  /**
   * Handle over completion
   */
  const handleOverComplete = useCallback(async () => {
    if (!firestore) return;

    try {
      const newOver = currentOver + 1;
      await incrementOver(firestore, matchId, currentOver);
      setCurrentOver(newOver);

      // Check if innings should end
      const maxOvers = format === 'T20' || format === 'IPL' ? 20 : format === 'ODI' ? 50 : 90;
      
      if (newOver >= maxOvers && currentInnings === 1) {
        await handleInningsBreak();
      } else if (newOver >= maxOvers * 2 && currentInnings === 2) {
        await handleMatchComplete();
      }

      toast({
        title: `Over ${newOver} Complete`,
        description: 'Match state updated. Events may have unlocked or locked.',
      });
    } catch (error) {
      console.error('Error incrementing over:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update match state.',
      });
    }
  }, [firestore, matchId, currentOver, currentInnings, format]);

  /**
   * Handle innings break
   */
  const handleInningsBreak = useCallback(async () => {
    if (!firestore) return;

    try {
      await startInningsBreak(firestore, matchId);
      toast({
        title: 'Innings Break',
        description: 'First innings complete. Second innings events will unlock soon.',
      });
    } catch (error) {
      console.error('Error starting innings break:', error);
    }
  }, [firestore, matchId]);

  /**
   * Start second innings
   */
  const handleSecondInningsStart = useCallback(async () => {
    if (!firestore) return;

    try {
      await startSecondInnings(firestore, matchId, format);
      setCurrentInnings(2);
      setCurrentOver(format === 'T20' || format === 'IPL' ? 20 : 50);

      toast({
        title: 'Second Innings Started',
        description: 'Second innings events are now available.',
      });
    } catch (error) {
      console.error('Error starting second innings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start second innings.',
      });
    }
  }, [firestore, matchId, format]);

  /**
   * Complete the match
   */
  const handleMatchComplete = useCallback(async () => {
    if (!firestore) return;

    try {
      await completeMatch(firestore, matchId);
      setIsTracking(false);

      toast({
        title: 'Match Complete',
        description: 'The match has ended. Final results are being calculated.',
      });
    } catch (error) {
      console.error('Error completing match:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete match.',
      });
    }
  }, [firestore, matchId]);

  /**
   * Manually set over number (for admin/testing)
   */
  const setOver = useCallback(async (over: number) => {
    if (!firestore) return;

    try {
      const { updateMatchState } = await import('@/lib/match-state-utils');
      await updateMatchState(firestore, matchId, { currentOver: over });
      setCurrentOver(over);

      toast({
        title: 'Over Updated',
        description: `Match state updated to Over ${over}.`,
      });
    } catch (error) {
      console.error('Error setting over:', error);
    }
  }, [firestore, matchId]);

  return {
    isTracking,
    currentOver,
    currentInnings,
    handleMatchStart,
    handleOverComplete,
    handleInningsBreak,
    handleSecondInningsStart,
    handleMatchComplete,
    setOver,
  };
}

