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
        hostname: 'kxklannprippgfqdxjfe.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect old /learn URLs to /articles
      {
        source: '/learn',
        destination: '/articles',
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/Learn',
        destination: '/articles',
        permanent: true,
      },
      // Redirect individual article URLs
      {
        source: '/learn/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
      {
        source: '/Learn/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
