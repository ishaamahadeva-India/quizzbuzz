'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export function useAgeVerification() {
  const { user } = useUser();
  const router = useRouter();
  const [showAgeDialog, setShowAgeDialog] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsVerified(false);
      return;
    }

    // Check if user has already verified age
    const ageVerified = localStorage.getItem(`age-verified-${user.uid}`);
    if (ageVerified === 'true') {
      setIsVerified(true);
      setShowAgeDialog(false);
    } else {
      // Show age verification dialog
      setShowAgeDialog(true);
    }
  }, [user]);

  const confirmAge = () => {
    if (user) {
      localStorage.setItem(`age-verified-${user.uid}`, 'true');
      setIsVerified(true);
      setShowAgeDialog(false);
    }
  };

  const rejectAge = () => {
    // Redirect to home or show message
    router.push('/');
  };

  return {
    showAgeDialog,
    isVerified,
    confirmAge,
    rejectAge,
  };
}

