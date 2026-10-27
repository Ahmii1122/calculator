"use client";

import { requestConsentBanner } from "@/lib/consent";

/** Footer control to reopen the analytics consent banner. */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => requestConsentBanner()}
      className="transition-colors hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      Cookie settings
    </button>
  );
}
