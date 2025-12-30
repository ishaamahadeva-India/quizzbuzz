'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface AgeVerificationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

export function AgeVerificationDialog({ open, onConfirm, onReject }: AgeVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            🔞 Age Verification Required
          </DialogTitle>
          <DialogDescription className="pt-2">
            You must be 18 years or older to participate in contests.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Please confirm your age to continue.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onConfirm}
              className="flex-1"
              variant="default"
            >
              I am 18+
            </Button>
            <Button
              onClick={onReject}
              className="flex-1"
              variant="outline"
            >
              I am under 18
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

