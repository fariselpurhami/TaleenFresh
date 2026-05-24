// next.config.mjs 

import { withSentryConfig } from '@sentry/nextjs'
import withSerwistInit from '@serwist/next'

const isDevelopment = process.env.NODE_ENV === 'development'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: isDevelopment,
  register: true,
  reloadOnOnline: false,
})

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['localhost', '192.168.1.3'],
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aoaruorpozxxtlrphuwf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

const sentryOptions = {
  org: 'taleenfresh',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
}

export default withSentryConfig(withSerwist(nextConfig), sentryOptions)
