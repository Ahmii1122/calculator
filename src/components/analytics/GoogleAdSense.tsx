import Script from "next/script";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * Google AdSense Auto ads loader. Renders nothing when the client ID is unset.
 * Uses beforeInteractive so the tag is present in <head> on every page.
 */
export function GoogleAdSense() {
  if (!ADSENSE_CLIENT) return null;

  return (
    <Script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="beforeInteractive"
    />
  );
}
