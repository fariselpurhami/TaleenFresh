// src/hooks/useHaptics.ts
'use client';
import { useCallback } from 'react';

type VibrationPattern = 'light' | 'medium' | 'success' | 'error';

export const useHaptics = () => {
  const trigger = useCallback((pattern: VibrationPattern) => {
    
    if (typeof window === 'undefined' || !navigator.vibrate) return;

    switch (pattern) {
      case 'light':
        navigator.vibrate(15); 
        break;
      case 'medium':
        navigator.vibrate(30); 
        break;
      case 'success':
        navigator.vibrate([50, 50, 100]); 
        break;
      case 'error':
        navigator.vibrate([50, 100, 50, 100]); 
        break;
    }
  }, []);

  return { trigger };
};
