// next.config.mjs
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  // مسارات الـ PWA
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'aoaruorpozxxtlrphuwf.supabase.co' },
    ],
  },
};

// هنا بيتم دمج الـ PWA مع إعدادات Next
export default withSerwist(nextConfig);
