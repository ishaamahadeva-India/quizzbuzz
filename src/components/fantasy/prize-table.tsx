'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Gift, Ticket } from 'lucide-react';
import type { PrizeDistribution, PrizeTier } from '@/lib/types';

interface PrizeTableProps {
  prizeDistribution: PrizeDistribution;
  participantCount: number; // Current number of participants
  campaignTitle?: string;
}

export function PrizeTable({ prizeDistribution, participantCount, campaignTitle }: PrizeTableProps) {
  const { tiers, totalPrizePool, currency = 'INR', notes } = prizeDistribution;

  // Filter tiers that are applicable based on participant count
  const applicableTiers = tiers.filter(tier => {
    if (tier.minParticipants) {
      return participantCount >= tier.minParticipants;
    }
    return true;
  });

  // Calculate effective rank end (handle -1 as "and above")
  const getRankDisplay = (tier: PrizeTier): string => {
    if (tier.rankEnd === -1) {
      return `${tier.rankStart}+`;
    }
    if (tier.rankStart === tier.rankEnd) {
      return `${tier.rankStart}`;
    }
    return `${tier.rankStart}-${tier.rankEnd}`;
  };

  // Get icon for prize type (non-cash only)
  const getPrizeIcon = (type: PrizeTier['prizeType']) => {
    switch (type) {
      case 'voucher':
        return <Ticket className="w-4 h-4" />;
      case 'merchandise':
        return <Gift className="w-4 h-4" />;
      case 'tickets':
        return <Ticket className="w-4 h-4" />;
      case 'ott_subscription':
        return <Award className="w-4 h-4" />;
      case 'experience':
        return <Award className="w-4 h-4" />;
      case 'travel':
        return <Award className="w-4 h-4" />;
      case 'certificate':
        return <Award className="w-4 h-4" />;
      case 'coupons':
        return <Gift className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Sponsored Rewards Distribution
            </CardTitle>
            {campaignTitle && (
              <CardDescription className="mt-1">{campaignTitle}</CardDescription>
            )}
          </div>
          {totalPrizePool && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Sponsored Rewards Pool: {formatCurrency(totalPrizePool)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {applicableTiers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No prize tiers available yet.</p>
            <p className="text-sm mt-2">
              {participantCount < Math.min(...tiers.map(t => t.minParticipants || 0)) && (
                <>Minimum {Math.min(...tiers.map(t => t.minParticipants || 0))} participants required.</>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Participant Count Info */}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">Current Participants:</span>
              <Badge variant="outline" className="text-base px-3 py-1">
                {participantCount}
              </Badge>
            </div>

            {/* Prize Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">Reward Value</th>
                    <th className="text-left py-3 px-4 font-semibold">Reward Type</th>
                    {notes && <th className="text-left py-3 px-4 font-semibold">Notes</th>}
                  </tr>
                </thead>
                <tbody>
                  {applicableTiers.map((tier, index) => (
                    <tr
                      key={index}
                      className={`border-b transition-colors ${
                        tier.rankStart === 1
                          ? 'bg-primary/5 font-semibold'
                          : tier.rankStart <= 10
                          ? 'bg-primary/2'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {tier.rankStart === 1 && (
                            <Trophy className="w-4 h-4 text-primary" />
                          )}
                          <span className={tier.rankStart === 1 ? 'text-primary font-bold' : ''}>
                            {getRankDisplay(tier)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-primary">
                          {formatCurrency(tier.prizeAmount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getPrizeIcon(tier.prizeType)}
                          <span className="capitalize">{tier.prizeType}</span>
                        </div>
                      </td>
                      {notes && (
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {tier.description || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Additional Notes */}
            {notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            )}

            {/* Info about inactive tiers */}
            {tiers.length > applicableTiers.length && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Note:</strong> Some prize tiers will become active as more participants join.
                  Current participants: {participantCount}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

