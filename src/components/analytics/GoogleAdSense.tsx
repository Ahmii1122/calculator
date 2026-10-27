"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isNoAnalyticsPath } from "@/lib/analytics-config";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * Existing AdSense loader (unchanged client ID). Skips NO_ANALYTICS_PATHS.
 * No new ad units or consent wiring in this pass.
 */
export function GoogleAdSense() {
  const pathname = usePathname();

  if (!ADSENSE_CLIENT) return null;
  if (isNoAnalyticsPath(pathname)) return null;

  return (
    <Script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
