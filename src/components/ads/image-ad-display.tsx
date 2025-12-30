'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageAdvertisement } from '@/lib/types';

type ImageAdDisplayProps = {
  advertisement: ImageAdvertisement;
  onComplete: (advertisementId: string) => void;
  onCancel?: () => void;
  required?: boolean;
  displayDuration?: number; // Override default duration
  adNumber?: number; // Current ad number (1, 2, 3)
  totalAds?: number; // Total number of ads in sequence
};

export function ImageAdDisplay({ 
  advertisement, 
  onComplete, 
  onCancel,
  required = true,
  displayDuration,
  adNumber = 1,
  totalAds = 1
}: ImageAdDisplayProps) {
  const duration = displayDuration || advertisement.displayDuration || 5;
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [canContinue, setCanContinue] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [viewStartTime] = useState(Date.now());

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanContinue(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const handleContinue = () => {
    setIsClosing(true);
    const viewedDuration = Math.floor((Date.now() - viewStartTime) / 1000);
    
    // Call onComplete with view duration
    setTimeout(() => {
      onComplete(advertisement.id);
    }, 300);
  };

  const handleImageClick = () => {
    if (advertisement.clickThroughUrl) {
      window.open(advertisement.clickThroughUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCancel = () => {
    if (!required && onCancel) {
      setIsClosing(true);
      setTimeout(() => {
        onCancel();
      }, 300);
    }
  };

  // Detect device type
  const deviceType = typeof window !== 'undefined' 
    ? window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
    : 'desktop';

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300",
      isClosing && "opacity-0 pointer-events-none"
    )}>
      <div className="relative bg-background rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        {/* Close button (if not required) */}
        {!required && onCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Ad Image */}
        <div 
          className={cn(
            "relative w-full flex-shrink-0 transition-opacity",
            "aspect-video sm:aspect-video",
            "min-h-[200px] sm:min-h-0",
            advertisement.clickThroughUrl && "cursor-pointer hover:opacity-90"
          )}
          onClick={handleImageClick}
        >
          <Image
            src={advertisement.imageUrl}
            alt={`Advertisement from ${advertisement.sponsorName}`}
            fill
            className="object-contain bg-muted"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
            unoptimized={deviceType === 'mobile'} // Optimize for mobile
          />
          {advertisement.clickThroughUrl && (
            <div className="absolute bottom-4 right-4">
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-background/90 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick();
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Sponsor
              </Button>
            </div>
          )}
        </div>

        {/* Timer & Continue Button */}
        <div className="p-3 sm:p-4 md:p-6 bg-muted/50 border-t flex-shrink-0">
          {!canContinue ? (
            <div className="text-center space-y-2 sm:space-y-3">
              {totalAds > 1 && (
                <p className="text-xs font-semibold text-primary">
                  Ad {adNumber} of {totalAds}
                </p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground">
                Please view this ad to continue
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-primary animate-pulse">
                  {timeRemaining}
                </div>
                <span className="text-muted-foreground text-xs sm:text-sm">
                  {timeRemaining === 1 ? 'second' : 'seconds'} remaining
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((duration - timeRemaining) / duration) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sponsored by{' '}
                  <span className="font-semibold text-foreground">
                    {advertisement.sponsorName}
                  </span>
                </p>
                {advertisement.description && (
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {advertisement.description}
                  </p>
                )}
                {totalAds > 1 && adNumber < totalAds && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAds - adNumber} more ad{totalAds - adNumber > 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
              <Button 
                onClick={handleContinue}
                size="lg"
                className="w-full sm:w-auto min-w-[140px] text-sm sm:text-base"
              >
                {totalAds > 1 && adNumber < totalAds ? 'Next Ad' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

