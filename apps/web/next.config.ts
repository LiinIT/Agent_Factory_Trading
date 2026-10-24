import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
};

export default nextConfig;
