import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const isDevelopment = process.env.NODE_ENV === 'development';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDevelopment,
  // For more robust offline experience, you can configure fallbacks and runtime caching later.
  // fallbacks: {
  //   document: '/_offline', // you would need to create this page
  // },
});

const nextConfig: NextConfig = {
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

export default withPWA(nextConfig);
