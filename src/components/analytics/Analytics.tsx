"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  getConsent,
  subscribe,
  type ConsentStatus,
} from "@/lib/consent";
import {
  isCanonicalHostname,
  isNoAnalyticsPath,
} from "@/lib/analytics-config";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

function setGaDisabled(disabled: boolean) {
  if (!GA_ID || typeof window === "undefined") return;
  window[`ga-disable-${GA_ID}`] = disabled;
}

function sendPageView(pathname: string) {
  if (!GA_ID || typeof window.gtag !== "function") return;
  if (isNoAnalyticsPath(pathname)) return;
  if (getConsent() !== "granted") return;
  if (!isCanonicalHostname()) return;
  if (window[`ga-disable-${GA_ID}`]) return;

  const pageLocation = `${window.location.origin}${pathname}`;

  window.gtag("event", "page_view", {
    page_path: pathname,
    page_location: pageLocation,
    page_title: document.title,
  });
}

/**
 * Consent-gated GA4. Loads only when consent is granted, host matches
 * NEXT_PUBLIC_SITE_URL, and the path is not in NO_ANALYTICS_PATHS.
 */
export function Analytics() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [consent, setConsentState] = useState<ConsentStatus>("unset");
  const [hydrated, setHydrated] = useState(false);

  pathnameRef.current = pathname;

  useEffect(() => {
    setHydrated(true);
    setConsentState(getConsent());
    return subscribe((next) => {
      setConsentState(next);
      if (next !== "granted" && GA_ID) {
        setGaDisabled(true);
      }
      if (next === "granted" && GA_ID) {
        setGaDisabled(false);
      }
    });
  }, []);

  const pathBlocked = isNoAnalyticsPath(pathname);
  const mayLoad =
    hydrated &&
    Boolean(GA_ID) &&
    consent === "granted" &&
    isCanonicalHostname() &&
    !pathBlocked;

  useEffect(() => {
    if (!hydrated || !GA_ID) return;

    if (consent !== "granted" || pathBlocked || !isCanonicalHostname()) {
      setGaDisabled(true);
      return;
    }

    setGaDisabled(false);
    // Client navigations after gtag is already present
    sendPageView(pathname);
  }, [hydrated, consent, pathname, pathBlocked]);

  if (!mayLoad || !GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          setGaDisabled(false);
          sendPageView(pathnameRef.current);
        }}
      />
      <Script id="ga4-consent-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: false,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}
