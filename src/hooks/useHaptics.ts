// src/hooks/useHaptics.ts
'use client';
import { useCallback } from 'react';

type VibrationPattern = 'light' | 'medium' | 'success' | 'error';

export const useHaptics = () => {
  const trigger = useCallback((pattern: VibrationPattern) => {
    // Defensive check: SSR or unsupported browser
    if (typeof window === 'undefined' || !navigator.vibrate) return;

    switch (pattern) {
      case 'light':
        navigator.vibrate(15); // Quick tap (increment/decrement)
        break;
      case 'medium':
        navigator.vibrate(30); // Solid UI interaction (open cart)
        break;
      case 'success':
        navigator.vibrate([50, 50, 100]); // Order generated
        break;
      case 'error':
        navigator.vibrate([50, 100, 50, 100]); // Invalid action
        break;
    }
  }, []);

  return { trigger };
};
