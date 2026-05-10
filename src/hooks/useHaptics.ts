// src/hooks/useHaptics.ts

'use client';

import { useCallback } from 'react';

export type VibrationPattern = 'light' | 'medium' | 'success' | 'error';

const VIBRATION_PATTERNS: Readonly<Record<VibrationPattern, number | number[]>> = {
  light: 15,
  medium: 30,
  success: [50, 50, 100],
  error: [50, 100, 50, 100],
};

export interface UseHapticsReturn {
  trigger: (pattern: VibrationPattern) => void;
}

export function useHaptics(): UseHapticsReturn {
  const trigger = useCallback((pattern: VibrationPattern) => {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      typeof navigator.vibrate !== 'function'
    ) {
      return;
    }

    try {
      navigator.vibrate(VIBRATION_PATTERNS[pattern]);
    } catch {
      return;
    }
  }, []);

  return { trigger };
}
