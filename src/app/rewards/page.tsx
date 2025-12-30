'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Gift, 
  Coins, 
  Calendar, 
  Gamepad2, 
  CheckCircle2, 
  Clock,
  ShoppingBag,
  Fuel,
  Store,
  Package
} from 'lucide-react';
import { 
  getActiveVouchers, 
  redeemVoucher, 
  getUserRedemptions 
} from '@/firebase/firestore/vouchers';
import { 
  checkAndAwardDailyLogin, 
  checkAndAwardDailyGame 
} from '@/firebase/firestore/daily-rewards';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Voucher, VoucherRedemption, UserProfile } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RewardsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [vouchers, setVouchers] = useState<(Voucher & { id: string })[]>([]);
  const [redemptions, setRedemptions] = useState<(VoucherRedemption & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [dailyLoginChecked, setDailyLoginChecked] = useState(false);
  const [dailyGameChecked, setDailyGameChecked] = useState(false);
  const [dailyLoginReward, setDailyLoginReward] = useState<{ awarded: boolean; streak: number; message: string } | null>(null);
  const [dailyGameReward, setDailyGameReward] = useState<{ awarded: boolean; message: string } | null>(null);

  // Get user profile
  const userProfileRef = firestore && user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile } = useDoc(userProfileRef);

  useEffect(() => {
    if (!firestore || !user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [vouchersData, redemptionsData] = await Promise.all([
          getActiveVouchers(firestore),
          getUserRedemptions(firestore, user.uid),
        ]);
        setVouchers(vouchersData);
        setRedemptions(redemptionsData);
      } catch (error: any) {
        console.error('Error loading rewards data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load rewards data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [firestore, user]);

  // Check daily login reward on mount
  useEffect(() => {
    if (!firestore || !user || dailyLoginChecked) return;

    const checkDailyLogin = async () => {
      try {
        const result = await checkAndAwardDailyLogin(firestore, user.uid, 99);
        setDailyLoginReward(result);
        if (result.awarded) {
          toast({
            title: 'Daily Login Reward!',
            description: result.message,
          });
        }
      } catch (error: any) {
        console.error('Error checking daily login:', error);
      } finally {
        setDailyLoginChecked(true);
      }
    };

    checkDailyLogin();
  }, [firestore, user, dailyLoginChecked]);

  // Check daily game reward on mount
  useEffect(() => {
    if (!firestore || !user || dailyGameChecked) return;

    const checkDailyGame = async () => {
      try {
        const result = await checkAndAwardDailyGame(firestore, user.uid, 99);
        setDailyGameReward(result);
        if (result.awarded) {
          toast({
            title: 'Daily Game Reward!',
            description: result.message,
          });
        }
      } catch (error: any) {
        console.error('Error checking daily game:', error);
      } finally {
        setDailyGameChecked(true);
      }
    };

    checkDailyGame();
  }, [firestore, user, dailyGameChecked]);

  const handleRedeemVoucher = async (voucherId: string) => {
    if (!firestore || !user) {
      toast({
        title: 'Error',
        description: 'Please log in to redeem vouchers',
        variant: 'destructive',
      });
      return;
    }

    setRedeeming(voucherId);
    try {
      await redeemVoucher(firestore, user.uid, voucherId);
      
      // Refresh data
      const [vouchersData, redemptionsData] = await Promise.all([
        getActiveVouchers(firestore),
        getUserRedemptions(firestore, user.uid),
      ]);
      setVouchers(vouchersData);
      setRedemptions(redemptionsData);

      toast({
        title: 'Voucher Redeemed!',
        description: 'Your redemption request has been submitted. You will receive your voucher code via email once processed.',
      });
    } catch (error: any) {
      toast({
        title: 'Redemption Failed',
        description: error.message || 'Failed to redeem voucher',
        variant: 'destructive',
      });
    } finally {
      setRedeeming(null);
    }
  };

  const getVoucherIcon = (type: string) => {
    switch (type) {
      case 'amazon':
        return <ShoppingBag className="w-6 h-6" />;
      case 'petrol':
        return <Fuel className="w-6 h-6" />;
      case 'grocery':
        return <Store className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Fulfilled</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const userPoints = (userProfile as UserProfile)?.points || 0;
  const loginStreak = (userProfile as UserProfile)?.dailyLoginStreak || 0;
  const lastLoginDate = (userProfile as UserProfile)?.lastDailyLoginDate;
  const lastGameDate = (userProfile as UserProfile)?.lastDailyGameDate;

  const today = new Date().toISOString().split('T')[0];
  const canClaimLogin = lastLoginDate !== today;
  const canClaimGame = lastGameDate !== today;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Rewards & Points</h1>
        <p className="text-muted-foreground mt-2">
          Earn points by playing games and redeem them for vouchers
        </p>
      </div>

      {/* Points Overview */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-primary" />
            Your Points Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{userPoints.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground mt-2">
            Play games daily to earn more points!
          </p>
        </CardContent>
      </Card>

      {/* Daily Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              Daily Login Reward
            </CardTitle>
            <CardDescription>
              Login daily to earn {99} points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Streak:</span>
                  <Badge variant="outline">{loginStreak} days</Badge>
                </div>
                {canClaimLogin ? (
                  <Alert>
                    <AlertDescription>
                      Login reward available! Refresh the page to claim.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Claimed today</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gamepad2 className="w-5 h-5" />
              Daily Game Reward
            </CardTitle>
            <CardDescription>
              Play at least 1 game daily to earn {99} points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-2">
                {canClaimGame ? (
                  <Alert>
                    <AlertDescription>
                      Play a game to claim your daily reward!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Claimed today</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="vouchers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vouchers">Redeem Vouchers</TabsTrigger>
          <TabsTrigger value="history">Redemption History</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : vouchers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No vouchers available at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vouchers.map((voucher) => {
                const canAfford = userPoints >= voucher.pointsRequired;
                const isOutOfStock = voucher.stock !== undefined && (voucher.redeemedCount || 0) >= voucher.stock;

                return (
                  <Card key={voucher.id} className={!canAfford ? 'opacity-60' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getVoucherIcon(voucher.voucherType)}
                          <CardTitle className="text-lg">{voucher.name}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-primary font-semibold">
                          ₹{voucher.value}
                        </Badge>
                      </div>
                      {voucher.description && (
                        <CardDescription>{voucher.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Points Required:</span>
                        <span className="font-semibold">{voucher.pointsRequired.toLocaleString()}</span>
                      </div>
                      {voucher.stock !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Stock:</span>
                          <span className="text-sm">
                            {voucher.stock - (voucher.redeemedCount || 0)} remaining
                          </span>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => handleRedeemVoucher(voucher.id)}
                        disabled={!canAfford || isOutOfStock || redeeming === voucher.id || !voucher.active}
                      >
                        {redeeming === voucher.id ? (
                          'Processing...'
                        ) : !canAfford ? (
                          'Insufficient Points'
                        ) : isOutOfStock ? (
                          'Out of Stock'
                        ) : !voucher.active ? (
                          'Unavailable'
                        ) : (
                          'Redeem Now'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : redemptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No redemption history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {redemptions.map((redemption) => (
                <Card key={redemption.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{redemption.voucherName}</CardTitle>
                        <CardDescription>
                          Redeemed on {(() => {
                            const redeemedAt = redemption.redeemedAt as any;
                            const date = redeemedAt instanceof Date 
                              ? redeemedAt 
                              : redeemedAt?.seconds 
                                ? new Date(redeemedAt.seconds * 1000)
                                : redeemedAt?.toDate
                                  ? redeemedAt.toDate()
                                  : new Date();
                            return date.toLocaleDateString();
                          })()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(redemption.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Points Spent:</span>
                        <p className="font-semibold">{redemption.pointsSpent.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Voucher Value:</span>
                        <p className="font-semibold">₹{redemption.voucherValue}</p>
                      </div>
                      {redemption.voucherCode && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Voucher Code:</span>
                          <p className="font-mono font-semibold text-primary">{redemption.voucherCode}</p>
                        </div>
                      )}
                      {redemption.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="text-sm">{redemption.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

