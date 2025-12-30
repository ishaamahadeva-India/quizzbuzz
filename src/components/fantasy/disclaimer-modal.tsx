
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore } from '@/firebase';
import { updateUserFantasySettings } from '@/firebase/firestore/users';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface DisclaimerModalProps {
  onClose?: () => void;
}

export function DisclaimerModal({ onClose }: DisclaimerModalProps = {}) {
  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const handleAccept = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save settings. Please try again.',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateUserFantasySettings(firestore, user.uid, {
        ageVerified: true,
        fantasyEnabled: true,
      });
      
      toast({
        title: 'Welcome to the Fantasy League!',
        description: 'Your settings have been saved.',
      });

      // Call the onClose callback if provided (preferred method)
      if (onClose) {
        // Wait a moment for Firestore to sync, then close
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        // Fallback: reload the page to ensure Firestore updates are reflected
        window.location.reload();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save settings. Please try again.',
      });
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Welcome to the Fantasy League</DialogTitle>
          <DialogDescription>
            Before you proceed, please confirm the following.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="age-verification"
              checked={ageChecked}
              onCheckedChange={(checked) => setAgeChecked(!!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="age-verification"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that I am 18 years of age or older.
              </label>
              <p className="text-sm text-muted-foreground">
                You must be an adult to participate in fantasy games.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms-acceptance"
              checked={termsChecked}
              onCheckedChange={(checked) => setTermsChecked(!!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms-acceptance"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand this is a game of skill.
              </label>
              <p className="text-sm text-muted-foreground">
                I acknowledge that all fantasy games on this platform are skill-based challenges and do not involve real money, betting, or any element of chance.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={!ageChecked || !termsChecked || isSaving}
          >
            {isSaving ? 'Saving...' : 'Accept and Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
