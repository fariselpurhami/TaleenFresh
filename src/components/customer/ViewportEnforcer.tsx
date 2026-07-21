'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const MIN_WIDTH = 428;
const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
const NARROW_VIEWPORT = `width=${MIN_WIDTH}, maximum-scale=1, user-scalable=no, viewport-fit=cover`;

// Extracted as a pure, deterministic function for V8 engine optimization
const getViewportContent = (width: number): string =>
  width > 0 && width < MIN_WIDTH ? NARROW_VIEWPORT : DEFAULT_VIEWPORT;

export function ViewportEnforcer() {
  const pathname = usePathname();
  
  // Isolate mutable state outside the React render cycle
  const currentContentRef = useRef<string | null>(null);
  const metaTagRef = useRef<HTMLMetaElement | null>(null);
  const rAFRef = useRef<number | null>(null);

  useEffect(() => {
    const updateDOM = () => {
      // Evaluate based on hardware screen width as dictated by domain rules
      const width = typeof window !== 'undefined' ? window.screen.width : 0;
      const newContent = getViewportContent(width);

      // 1. DOM Query Caching: Only query if uninitialized or detached by Next.js router
      if (!metaTagRef.current || !metaTagRef.current.isConnected) {
        metaTagRef.current = document.querySelector('meta[name="viewport"]');
        
        if (!metaTagRef.current) {
          const meta = document.createElement('meta');
          meta.name = 'viewport';
          document.head.appendChild(meta);
          metaTagRef.current = meta;
        }
      }

      // 2. Mutation Diffing: Prevent layout thrashing by blocking redundant DOM writes
      if (currentContentRef.current !== newContent) {
        metaTagRef.current.setAttribute('content', newContent);
        currentContentRef.current = newContent;
      }
    };

    // 3. Frame Throttling: Debounce OS-level events to the rendering pipeline
    const handleResize = () => {
      if (rAFRef.current !== null) cancelAnimationFrame(rAFRef.current);
      rAFRef.current = requestAnimationFrame(updateDOM);
    };

    // Execute immediately on mount or layout boundary shift
    updateDOM();

    const orientation = window.screen?.orientation;
    const supportsScreenOrientation = typeof orientation?.addEventListener === 'function';

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    if (supportsScreenOrientation) {
      orientation.addEventListener('change', handleResize);
    }

    return () => {
      if (rAFRef.current !== null) cancelAnimationFrame(rAFRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      if (supportsScreenOrientation) {
        orientation.removeEventListener('change', handleResize);
      }
    };
  }, [pathname]);

  // 4. SSR Blocking Script: Minified IIFE to prevent FCP layout shift before React boots
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `!function(){var e=window.screen.width;if(e>0&&e<${MIN_WIDTH}){var t=document.querySelector('meta[name="viewport"]');t||(t=document.createElement("meta"),t.name="viewport",document.head.appendChild(t)),t.setAttribute("content","${NARROW_VIEWPORT}")}}();`
      }}
    />
  );
}
