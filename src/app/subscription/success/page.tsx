'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const { user } = useUser();
  const firestore = useFirestore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
  const { data: userProfile } = useDoc(userProfileRef);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId || !user) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            userId: user.uid,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setIsVerified(true);
          toast({
            title: 'Subscription Activated!',
            description: 'Your annual subscription has been activated successfully.',
          });
        } else {
          toast({
            title: 'Payment Verification Pending',
            description: 'Your payment is being processed. Subscription will be activated shortly.',
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast({
          title: 'Verification Error',
          description: 'Unable to verify payment. Please contact support if the issue persists.',
          variant: 'destructive',
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId, user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          {isVerifying ? (
            <>
              <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Verifying Payment...</CardTitle>
              <CardDescription>Please wait while we verify your payment</CardDescription>
            </>
          ) : isVerified ? (
            <>
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <CardTitle>Subscription Activated!</CardTitle>
              <CardDescription>
                Your annual subscription has been successfully activated
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Payment Received</CardTitle>
              <CardDescription>
                Your payment is being processed. Subscription will be activated shortly.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="text-center text-sm text-muted-foreground">
              Order ID: {orderId}
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/profile">Go to Profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/fantasy">Start Playing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

