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
      { protocol: 'https', hostname: 'portal.elsupplier.com' },
      { protocol: 'https', hostname: 'www.osmanmarket.com' },
      { protocol: 'https', hostname: 'www.expoegypt.gov.eg' },   
      { protocol: 'https', hostname: 'www.osmanmarket.com' },
      { protocol: 'https', hostname: 'bf1af2.akinoncloudcdn.com' },
      { protocol: 'https', hostname: 'www.arafatrade.com' },
      { protocol: 'https', hostname: 'greenranch.ps' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'set-elhosn.com' },
      { protocol: 'https', hostname: 'cdn.kibsons.com' },
      { protocol: 'https', hostname: 'image.made-in-china.com' },	   
      { protocol: 'https', hostname: 'set-elhosn.com' },
      { protocol: 'https', hostname: 'img.waimaoniu.net' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'cdn.mafrservices.com' },
      { protocol: 'https', hostname: 'cdn.salla.sa' },
      { protocol: 'https', hostname: 'www.qebox.app' },
      { protocol: 'https', hostname: 'khairatlebanon.com' },
      { protocol: 'https', hostname: 'thefreshandnatural.com' },
      { protocol: 'https', hostname: 'media.gemini.media' },
      { protocol: 'https', hostname: 'egyptvalleyexport.com' },
      { protocol: 'https', hostname: 'visuals.rijkzwaan.com' },
      { protocol: 'https', hostname: 'aleasima.store' },
      { protocol: 'https', hostname: 'www.heddensofwoodtown.co.uk' }
    ],
  },
};

// هنا بيتم دمج الـ PWA مع إعدادات Next
export default withSerwist(nextConfig);
