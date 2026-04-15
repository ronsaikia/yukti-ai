import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google-cloud/speech', '@google-cloud/vertexai'],
  turbopack: {
    // Keep root scoped to this app when parent folders contain other lockfiles.
    root: process.cwd(),
  },
};

export default nextConfig;