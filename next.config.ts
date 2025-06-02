
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const baseNextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

let finalConfig = baseNextConfig;

// Only apply PWA enhancements for production builds
if (process.env.NODE_ENV === 'production') {
  const withPWA = withPWAInit({
    dest: 'public',
    register: true, // Ensure the service worker is registered in production
    skipWaiting: true, // Allow new service workers to activate immediately
    // The 'disable' flag is not strictly necessary here, as this block
    // only runs if NODE_ENV is 'production'.
    // By default, @ducanh2912/next-pwa disables itself if NODE_ENV is 'development'.
  });
  finalConfig = withPWA(baseNextConfig);
}

export default finalConfig;
