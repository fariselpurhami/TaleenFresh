// next.config.mjs
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'aoaruorpozxxtlrphuwf.supabase.co' },
    ],
  },
};

export default withSerwist(nextConfig);
