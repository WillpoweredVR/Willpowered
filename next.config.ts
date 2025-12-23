import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.squarespace.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/**',
      },
    ],
  },
  // 301 Redirects to preserve SEO from old SquareSpace URLs
  async redirects() {
    return [
      // Redirect /learn/* to /articles/* (preserves SEO from SquareSpace)
      {
        source: '/learn/:slug',
        destination: '/articles/:slug',
        permanent: true, // 301 redirect
      },
      // Also handle old domain variations that might be indexed
      {
        source: '/learn/:slug/',
        destination: '/articles/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
