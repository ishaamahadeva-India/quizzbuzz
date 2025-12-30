'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface WelcomeDisclaimerDialogProps {
  open: boolean;
  onAccept: () => void;
}

export function WelcomeDisclaimerDialog({ open, onAccept }: WelcomeDisclaimerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            🎉 Welcome to QuizzBuzz!
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-2">
            <p className="font-semibold text-foreground">
              All contests are <strong className="text-green-600">FREE</strong> to play and skill-based.
            </p>
            <p>
              Prizes are <strong className="text-purple-600">non-cash</strong> and sponsor-funded. No money is required to participate.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              By signing up, you agree to our Terms & Conditions and Privacy Policy.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start"
              >
                <Link href="/terms" target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Terms & Conditions
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start"
              >
                <Link href="/privacy" target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Privacy Policy
                </Link>
              </Button>
            </div>
          </div>
          <Button
            onClick={onAccept}
            className="w-full"
          >
            Accept & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

