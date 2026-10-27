/**
 * Minimal analytics consent store.
 * Only storage allowed on the site: this one localStorage key (not calculator inputs).
 */

declare global {
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

export type ConsentStatus = "unset" | "granted" | "denied";

export type ConsentRecord = {
  status: "granted" | "denied";
  updatedAt: string;
};

export const CONSENT_STORAGE_KEY = "calcdaily_analytics_consent";

type Listener = (status: ConsentStatus) => void;

const listeners = new Set<Listener>();

function readStored(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed?.status !== "granted" && parsed?.status !== "denied") return null;
    if (typeof parsed.updatedAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Global Privacy Control → treat as denied without prompting. */
export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.globalPrivacyControl === true;
}

export function getConsent(): ConsentStatus {
  if (hasGlobalPrivacyControl()) return "denied";
  const stored = readStored();
  return stored?.status ?? "unset";
}

export function setConsent(status: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  const record: ConsentRecord = {
    status,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Quota / private mode — still notify in-memory listeners for this session.
  }
  for (const listener of listeners) listener(status);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Open the consent banner again (footer “Cookie settings”). */
export const CONSENT_REOPEN_EVENT = "calcdaily:consent-reopen";

export function requestConsentBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT));
}
