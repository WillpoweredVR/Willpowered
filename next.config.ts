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
};

export default nextConfig;
