// next.config.mjs

import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

export default withSerwist(nextConfig);
