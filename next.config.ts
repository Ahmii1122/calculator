import type { NextConfig } from "next";

const isVercelProduction = process.env.VERCEL_ENV === "production";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async redirects() {
    if (!siteUrl) return [];

    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "calculator-neon-delta-92.vercel.app",
          },
        ],
        destination: `${siteUrl}/:path*`,
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
