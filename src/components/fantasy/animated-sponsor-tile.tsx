'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AnimatedSponsorTileProps = {
  sponsorName: string;
  sponsorLogo?: string;
  sponsorWebsite?: string;
  label?: string;
  variant?: 'overall' | 'event';
  className?: string;
};

export function AnimatedSponsorTile({
  sponsorName,
  sponsorLogo,
  sponsorWebsite,
  label = 'Sponsored by',
  variant = 'overall',
  className,
}: AnimatedSponsorTileProps) {
  const isOverall = variant === 'overall';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('relative', className)}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-2',
          isOverall
            ? 'bg-gradient-to-r from-primary/10 via-background to-primary/5 border-primary/30'
            : 'bg-gradient-to-br from-primary/5 to-background border-primary/20'
        )}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
          }}
        />

        {/* Sparkle animation */}
        {isOverall && (
          <motion.div
            className="absolute top-2 right-2"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
        )}

        <CardContent className={cn('relative z-10 p-4', isOverall ? 'sm:p-6' : 'p-4')}>
          <div className={cn('flex items-center gap-3', isOverall ? 'justify-between' : 'flex-col sm:flex-row')}>
            <div className="flex items-center gap-3 flex-1">
              {sponsorLogo && (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={cn(
                    'relative flex-shrink-0 rounded-lg overflow-hidden bg-background',
                    isOverall ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-10 h-10'
                  )}
                >
                  <Image
                    src={sponsorLogo}
                    alt={sponsorName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 64px, 80px"
                  />
                </motion.div>
              )}
              <div className="flex-1 min-w-0">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    'text-muted-foreground font-medium',
                    isOverall ? 'text-xs sm:text-sm' : 'text-xs'
                  )}
                >
                  {label}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    'font-bold text-foreground truncate',
                    isOverall ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                  )}
                >
                  {sponsorName}
                </motion.p>
              </div>
            </div>

            {sponsorWebsite && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  variant={isOverall ? 'default' : 'outline'}
                  size={isOverall ? 'sm' : 'sm'}
                  className={cn(
                    'shrink-0',
                    isOverall && 'hidden sm:flex'
                  )}
                >
                  <Link href={sponsorWebsite} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    {isOverall ? 'Visit' : 'Visit Sponsor'}
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>

          {/* Pulse effect for overall sponsors */}
          {isOverall && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

