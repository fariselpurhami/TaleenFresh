'use client';

import { useEffect } from 'react';

const MIN_WIDTH = 428;
const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1, viewport-fit=cover';

function getViewportContent(width: number): string {
  return width > 0 && width < MIN_WIDTH
    ? `width=${MIN_WIDTH}, viewport-fit=cover`
    : DEFAULT_VIEWPORT;
}

export function ViewportEnforcer() {
  useEffect(() => {
    const applyViewport = () => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute('content', getViewportContent(window.screen.width));
      }
    };

    applyViewport();

    const orientation = window.screen.orientation;
    const supportsScreenOrientation = typeof orientation?.addEventListener === 'function';

    window.addEventListener('resize', applyViewport, { passive: true });
    window.addEventListener('orientationchange', applyViewport, { passive: true });

    if (supportsScreenOrientation) {
      orientation.addEventListener('change', applyViewport);
    }

    return () => {
      window.removeEventListener('resize', applyViewport);
      window.removeEventListener('orientationchange', applyViewport);

      if (supportsScreenOrientation) {
        orientation.removeEventListener('change', applyViewport);
      }
    };
  }, []);

  const blockingScript = `
    (function() {
      var w = window.screen.width;
      if (w > 0 && w < ${MIN_WIDTH}) {
        var m = document.querySelector('meta[name="viewport"]');
        if (!m) {
          m = document.createElement('meta');
          m.name = 'viewport';
          document.head.appendChild(m);
        }
        m.setAttribute('content', 'width=${MIN_WIDTH}, viewport-fit=cover');
      }
    })();
  `.replace(/\s+/g, ' ').trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: blockingScript }}
      suppressHydrationWarning
    />
  );
}
