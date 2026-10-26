import type { NextConfig } from "next";

const isVercelProduction = process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "calculator-neon-delta-92.vercel.app",
          },
        ],
        destination: "https://calcdaily.app/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    if (isVercelProduction) return [];
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
