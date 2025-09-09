import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment optimizations
  serverExternalPackages: ['mysql2', '@prisma/client'],
  
  // ESLint configuration for production
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during Vercel builds
  },
  
  // TypeScript configuration for production
  typescript: {
    ignoreBuildErrors: false, // Keep type checking enabled
  },
  
  // Output configuration
  outputFileTracingRoot: __dirname,
  
  // Image optimization for Vercel
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Build optimization
  poweredByHeader: false,
  compress: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
