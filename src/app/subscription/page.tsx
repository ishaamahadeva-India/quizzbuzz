'use client';

import { useState, useEffect } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Crown, Loader2, Calendar, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Script from 'next/script';

export default function SubscriptionPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCashfreeLoaded, setIsCashfreeLoaded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
  const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

  const profile = userProfile ? { ...userProfile, id: user?.uid } as UserProfile : null;
  const isSubscribed = profile?.isSubscribed && profile?.subscriptionStatus === 'active';
  const subscriptionEndDate = profile?.subscriptionEndDate
    ? (profile.subscriptionEndDate instanceof Date
        ? profile.subscriptionEndDate
        : new Date((profile.subscriptionEndDate as any)?.seconds * 1000 || profile.subscriptionEndDate))
    : null;
  const isActive = subscriptionEndDate ? new Date() < subscriptionEndDate : false;

  const handleSubscribe = async () => {
    if (!user || !profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to subscribe',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    // Check if Cashfree SDK is loaded
    if (!isCashfreeLoaded || !window.Cashfree || typeof window.Cashfree.Checkout !== 'function') {
      if (!isRetrying) {
        setIsRetrying(true);
        toast({
          title: 'Payment Gateway Loading',
          description: 'Please wait for the payment gateway to load...',
        });
        // Wait a bit and check again
        setTimeout(() => {
          if (window.Cashfree && typeof window.Cashfree.Checkout === 'function') {
            setIsCashfreeLoaded(true);
            setIsRetrying(false);
            // Retry the subscription
            handleSubscribe();
          } else {
            setIsRetrying(false);
            toast({
              title: 'Payment Gateway Error',
              description: 'Payment gateway not loaded. Please refresh the page.',
              variant: 'destructive',
            });
          }
        }, 2000);
      } else {
        toast({
          title: 'Payment Gateway Error',
          description: 'Payment gateway not loaded. Please refresh the page.',
          variant: 'destructive',
        });
        setIsRetrying(false);
      }
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment order
      const response = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email || profile.email,
          name: profile.displayName || user.displayName || 'User',
          phone: profile.phoneNumber || '9999999999',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to create payment order');
      }

      if (data.success && data.paymentSessionId) {
        // Verify Cashfree is still available
        if (!window.Cashfree || typeof window.Cashfree.Checkout !== 'function') {
          throw new Error('Payment gateway not available');
        }

        // Load Cashfree checkout
        const checkoutOptions = {
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_self' as const,
        };

        window.Cashfree.Checkout({
          ...checkoutOptions,
          onSuccess: async () => {
            // Verify payment
            const verifyResponse = await fetch('/api/subscription/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.orderId,
                userId: user.uid,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              toast({
                title: 'Subscription Activated!',
                description: 'Your annual subscription has been activated successfully.',
              });
              router.push('/subscription/success');
            } else {
              toast({
                title: 'Payment Verification Pending',
                description: 'Your payment is being processed. Subscription will be activated shortly.',
              });
            }
          },
          onFailure: () => {
            toast({
              title: 'Payment Failed',
              description: 'Payment could not be processed. Please try again.',
              variant: 'destructive',
            });
            setIsProcessing(false);
          },
        });
      } else {
        throw new Error(data.error || 'Failed to create payment order');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate subscription. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Please log in to view subscription options</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/login')}>Log In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Cashfree SDK loaded');
          // Verify it's actually available
          if (window.Cashfree && typeof window.Cashfree.Checkout === 'function') {
            console.log('Cashfree Checkout is available');
            setIsCashfreeLoaded(true);
          } else {
            console.error('Cashfree SDK loaded but Checkout not available');
            setIsCashfreeLoaded(false);
          }
        }}
        onError={(e) => {
          console.error('Failed to load Cashfree SDK:', e);
          toast({
            title: 'Payment Gateway Error',
            description: 'Failed to load payment gateway. Please refresh the page.',
            variant: 'destructive',
          });
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Unlock premium features with our annual subscription
          </p>
        </div>

        {isSubscribed && isActive ? (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <CardTitle>Active Subscription</CardTitle>
              </div>
              <CardDescription>
                Your annual subscription is active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan:</span>
                <span className="font-semibold">Annual Subscription</span>
              </div>
              {subscriptionEndDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valid Until:</span>
                  <span className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(subscriptionEndDate, 'PPP')}
                  </span>
                </div>
              )}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Premium Features:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Full access to all fantasy features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Ad-free experience</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Exclusive tournaments and events</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Annual Subscription</CardTitle>
                  <CardDescription>Best value for premium features</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">₹99</div>
                  <div className="text-sm text-muted-foreground">per year</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">What's Included:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Full access to all fantasy cricket features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Ad-free browsing experience</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Priority customer support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Exclusive tournaments and events</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Early access to new features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>Detailed analytics and insights</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSubscribe}
                disabled={isProcessing || !isCashfreeLoaded}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : !isCashfreeLoaded ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Payment Gateway...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscribe Now - ₹99/year
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}

