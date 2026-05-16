// src/components/customer/ViewportEnforcer.tsx

'use client';

import { useEffect } from 'react';

const SMALL_MOBILE_LAYOUT_WIDTH = 428;
const DEFAULT_VIEWPORT_CONTENT = 'width=device-width, initial-scale=1, viewport-fit=cover';

function resolveViewportContent(screenWidth: number): string {
  if (screenWidth > 0 && screenWidth < SMALL_MOBILE_LAYOUT_WIDTH) {
    return `width=${SMALL_MOBILE_LAYOUT_WIDTH}, viewport-fit=cover`;
  }

  return DEFAULT_VIEWPORT_CONTENT;
}

export function ViewportEnforcer() {
  useEffect(() => {
    const meta =
      document.querySelector<HTMLMetaElement>('meta[name="viewport"]') ??
      (() => {
        const element = document.createElement('meta');
        element.name = 'viewport';
        document.head.appendChild(element);
        return element;
      })();

    const applyViewport = () => {
      meta.setAttribute('content', resolveViewportContent(window.screen.width));
    };

    applyViewport();

    const handleChange = () => {
      applyViewport();
    };

    window.addEventListener('resize', handleChange, { passive: true });
    window.screen.orientation?.addEventListener?.('change', handleChange);

    return () => {
      window.removeEventListener('resize', handleChange);
      window.screen.orientation?.removeEventListener?.('change', handleChange);
    };
  }, []);

  return null;
}
