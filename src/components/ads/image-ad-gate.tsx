'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { selectAdForEntry, selectAdForCampaign, selectMultipleAdsForEntry, selectMultipleAdsForCampaign, incrementAdViews } from '@/firebase/firestore/image-advertisements';
import { createImageAdView, completeImageAdView, hasUserViewedAd, hasUserViewedAdForCampaign, getUserAdViews } from '@/firebase/firestore/image-ad-views';
import { ImageAdDisplay } from './image-ad-display';
import { Skeleton } from '@/components/ui/skeleton';
import type { ImageAdvertisement } from '@/lib/types';

type ImageAdGateProps = {
  tournamentId?: string; // For cricket tournaments
  campaignId?: string; // For movie fantasy campaigns
  onComplete: (adViewId?: string, advertisementId?: string) => void;
  onCancel?: () => void;
  required?: boolean;
};

export function ImageAdGate({ 
  tournamentId,
  campaignId,
  onComplete, 
  onCancel,
  required = true 
}: ImageAdGateProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [ads, setAds] = useState<ImageAdvertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  const [viewIds, setViewIds] = useState<string[]>([]);
  const hasRunRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  
  // Sequential ad durations: 9s, 6s, 5s (total 20s)
  const AD_DURATIONS = [9, 6, 5];
  
  // Use refs to store callbacks to avoid infinite loops from function recreation
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  
  // Update refs when callbacks change (this doesn't trigger main effect)
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCancelRef.current = onCancel;
  }, [onComplete, onCancel]);

  useEffect(() => {
    // Don't run if already viewed
    if (hasViewed) {
      return;
    }
    
    const targetId = tournamentId || campaignId;
    if (!targetId || !firestore || !user?.uid) {
      console.warn('[ImageAdGate] Missing required parameters', {
        hasTargetId: !!targetId,
        hasFirestore: !!firestore,
        hasUserId: !!user?.uid,
        tournamentId,
        campaignId
      });
      setIsLoading(false);
      return;
    }
    
    // Reset hasRunRef if targetId changed (allows ads on different pages)
    if (hasRunRef.current && hasRunRef.current !== targetId) {
      hasRunRef.current = null;
    }
    
    // Prevent multiple runs for the same targetId in same session
    if (hasRunRef.current === targetId) {
      return;
    }
    
    // Mark as run immediately to prevent concurrent runs
    hasRunRef.current = targetId;
    
    let cancelled = false;
    
    const checkAndLoadAds = async () => {
      try {
        const isCampaign = !!campaignId;
        
        // Select multiple ads for sequential display (3 ads: 9s, 6s, 5s)
        const selectedAds = isCampaign
          ? await selectMultipleAdsForCampaign(firestore, targetId, user.uid, 3)
          : await selectMultipleAdsForEntry(firestore, targetId, user.uid, 3);
        
        if (cancelled) return;
        
        if (!selectedAds || selectedAds.length === 0) {
          // No ads available, allow entry or show error
          console.warn('[ImageAdGate] No ads available', {
            targetId,
            isCampaign: !!campaignId,
            userId: user.uid,
            reason: 'No active ads found in database for this tournament/campaign'
          });
          setIsLoading(false);
          if (required) {
            // If required but no ads, still allow (fallback)
            console.warn('[ImageAdGate] Ads required but none available, allowing entry anyway');
            onCompleteRef.current();
          } else if (onCancelRef.current) {
            onCancelRef.current();
          }
          return;
        }

        console.log('[ImageAdGate] Selected ads:', {
          count: selectedAds.length,
          adIds: selectedAds.map(ad => ad.id),
          targetId,
          userId: user.uid
        });

        // Filter ads based on user view limits and repeat settings
        const eligibleAds: ImageAdvertisement[] = [];
        
        for (const ad of selectedAds) {
          // Check user's view limit for this ad
          if (ad.maxViewsPerUser) {
            const userViews = await getUserAdViews(firestore, user.uid, ad.id);
            const completedViews = userViews.filter(v => v.wasCompleted).length;
            
            if (completedViews >= ad.maxViewsPerUser) {
              continue; // Skip this ad, user reached limit
            }
          }

          // Check repeat behavior settings
          const repeatInterval = ad.repeatInterval || 'never';
          const minTimeBetweenViews = ad.minTimeBetweenViews;
          const allowMultipleViews = ad.allowMultipleViews || false;

          // Handle session-based repeat (check localStorage)
          if (repeatInterval === 'session') {
            const sessionKey = `ad-viewed-session-${targetId}-${ad.id}-${user.uid}`;
            const hasViewedThisSession = localStorage.getItem(sessionKey);
            if (hasViewedThisSession && !allowMultipleViews) {
              continue; // Skip this ad, already viewed this session
            }
          }

          // Check if user already viewed this ad (respecting repeat settings)
          if (repeatInterval !== 'always' && !allowMultipleViews) {
            const alreadyViewed = isCampaign
              ? await hasUserViewedAdForCampaign(
                  firestore, 
                  user.uid, 
                  targetId, 
                  ad.id,
                  repeatInterval,
                  minTimeBetweenViews
                )
              : await hasUserViewedAd(
                  firestore, 
                  user.uid, 
                  targetId, 
                  ad.id,
                  repeatInterval,
                  minTimeBetweenViews
                );
            
            if (alreadyViewed) {
              continue; // Skip this ad, already viewed
            }
          }

          eligibleAds.push(ad);
        }

        if (cancelled) return;

        if (eligibleAds.length === 0) {
          // No eligible ads after filtering
          // If we have selectedAds but they were all filtered, try showing them anyway
          // (user might have viewed them before, but we still want to show ads)
          if (selectedAds.length > 0) {
            console.warn('[ImageAdGate] All ads filtered out, showing ads anyway for better UX', {
              selectedAdsCount: selectedAds.length,
              filteredOutReasons: selectedAds.map(ad => ({
                adId: ad.id,
                maxViewsPerUser: ad.maxViewsPerUser,
                repeatInterval: ad.repeatInterval,
                allowMultipleViews: ad.allowMultipleViews
              })),
              targetId,
              userId: user.uid
            });
            // Show ads anyway, but limit to 1-2 ads if user has viewed before
            const adsToShowAnyway = selectedAds.slice(0, 2);
            if (!cancelled) {
              setAds(adsToShowAnyway);
              setCurrentAdIndex(0);
              setIsLoading(false);
              return;
            }
          }
          
          // If no ads at all, allow entry
          console.warn('[ImageAdGate] No eligible ads after filtering, allowing entry', {
            selectedAdsCount: selectedAds.length,
            eligibleAdsCount: 0,
            targetId,
            userId: user.uid
          });
          setHasViewed(true);
          setIsLoading(false);
          setTimeout(() => {
            if (!cancelled) {
              onCompleteRef.current();
            }
          }, 500);
          return;
        }

        console.log('[ImageAdGate] Eligible ads after filtering:', {
          eligibleCount: eligibleAds.length,
          eligibleAdIds: eligibleAds.map(ad => ad.id),
          targetId,
          userId: user.uid
        });

        // Limit to 3 ads max
        const adsToShow = eligibleAds.slice(0, 3);

        if (!cancelled) {
          setAds(adsToShow);
          setCurrentAdIndex(0);
          setIsLoading(false);
          console.log('[ImageAdGate] Ads loaded successfully', {
            adsToShow: adsToShow.length,
            adIds: adsToShow.map(ad => ad.id),
            targetId,
            userId: user.uid
          });
        }
      } catch (error) {
        console.error('[ImageAdGate] Error loading ads:', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          targetId,
          isCampaign: !!campaignId,
          userId: user?.uid,
          firestoreReady: !!firestore
        });
        // On error, allow entry (don't block user)
        if (!cancelled) {
          setIsLoading(false);
          if (!required && onCancelRef.current) {
            onCancelRef.current();
          } else {
            onCompleteRef.current();
          }
        }
      }
    };

    checkAndLoadAds();
    
    // Cleanup function
    return () => {
      cancelled = true;
      // Reset hasRunRef on unmount to allow ads on next mount
      // (but keep it for same targetId to prevent duplicate runs)
    };
  }, [firestore, user?.uid, tournamentId, campaignId, required, hasViewed]);

  const handleAdComplete = async (advertisementId: string) => {
    if (!firestore || !user?.uid || ads.length === 0) {
      // If missing required data, still allow entry
      onCompleteRef.current();
      return;
    }

    const currentAd = ads[currentAdIndex];
    if (!currentAd || currentAd.id !== advertisementId) {
      // Ad mismatch, skip
      return;
    }

    try {
      // Create ad view record for current ad
      const deviceType = typeof window !== 'undefined' 
        ? window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
        : 'desktop';
      
      const browser = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

      // Use sequential duration (9s, 6s, 5s) instead of ad's displayDuration
      const duration = AD_DURATIONS[currentAdIndex] || currentAd.displayDuration || 5;

      const viewData: any = {
        advertisementId: currentAd.id,
        userId: user.uid,
        viewedAt: new Date(),
        viewedDuration: duration,
        wasCompleted: true,
        clicked: false,
        deviceType,
        browser,
      };

      // Add tournamentId or campaignId based on which one is provided
      if (tournamentId) {
        viewData.tournamentId = tournamentId;
      }
      if (campaignId) {
        viewData.campaignId = campaignId;
      }

      const newView = await createImageAdView(firestore, viewData);

      const viewIdStr = newView.id;
      const newViewIds = [...viewIds, viewIdStr];
      setViewIds(newViewIds);

      // Mark as completed (with a small delay to ensure document is written)
      // Note: createImageAdView already sets wasCompleted based on viewData,
      // but we update it here to ensure consistency and set updatedAt timestamp
      try {
        // Small delay to ensure the document write is complete before updating
        await new Promise(resolve => setTimeout(resolve, 100));
        await completeImageAdView(firestore, viewIdStr);
      } catch (updateError) {
        // If update fails, log but don't block - the view was already created
        console.warn('Failed to update ad view completion status:', updateError);
      }

      // Increment ad view count
      await incrementAdViews(firestore, currentAd.id);

      // Mark session view if using session-based repeat
      const targetId = tournamentId || campaignId;
      if (currentAd.repeatInterval === 'session') {
        const sessionKey = `ad-viewed-session-${targetId}-${currentAd.id}-${user.uid}`;
        localStorage.setItem(sessionKey, 'true');
      }

      // Check if there are more ads to show
      if (currentAdIndex < ads.length - 1) {
        // Show next ad
        setCurrentAdIndex(currentAdIndex + 1);
      } else {
        // All ads completed
        setHasViewed(true);
        // Call completion callback with last view ID and ad ID
        onCompleteRef.current(viewIdStr, currentAd.id);
      }
    } catch (error) {
      console.error('Error completing ad view:', error);
      // Still proceed to next ad or complete if tracking fails
      if (currentAdIndex < ads.length - 1) {
        setCurrentAdIndex(currentAdIndex + 1);
      } else {
        setHasViewed(true);
        onCompleteRef.current(undefined, currentAd.id);
      }
    }
  };

  const handleAdClick = async () => {
    if (!firestore || viewIds.length === 0 || ads.length === 0) return;

    const currentAd = ads[currentAdIndex];
    const currentViewId = viewIds[currentAdIndex];
    
    if (!currentAd?.clickThroughUrl || !currentViewId) return;

    try {
      const { trackImageAdClick } = await import('@/firebase/firestore/image-ad-views');
      await trackImageAdClick(firestore, currentViewId, currentAd.clickThroughUrl);
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4">
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (hasViewed || ads.length === 0) {
    return null; // Already viewed or no ads available
  }

  const currentAd = ads[currentAdIndex];
  if (!currentAd) {
    return null;
  }

  // Use sequential duration (9s, 6s, 5s) instead of ad's displayDuration
  const duration = AD_DURATIONS[currentAdIndex] || currentAd.displayDuration || 5;
  const adNumber = currentAdIndex + 1;
  const totalAds = ads.length;

  return (
    <ImageAdDisplay
      advertisement={currentAd}
      onComplete={handleAdComplete}
      onCancel={onCancel}
      required={required}
      displayDuration={duration}
      adNumber={adNumber}
      totalAds={totalAds}
    />
  );
}

