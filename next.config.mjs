// next.config.mjs

import { withSentryConfig } from '@sentry/nextjs';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: false,
});

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.5', 'localhost:3000'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aoaruorpozxxtlrphuwf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withSentryConfig(withSerwist(nextConfig), {
  org: 'taleenfresh',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
