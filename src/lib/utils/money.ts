/**
 * Shared display-only currency formatting and cent helpers.
 * No FX conversion — symbols and locales only.
 */

export type CurrencyOption = {
  id: string;
  label: string;
  /** ISO 4217 code, or null for plain numbers with no currency symbol. */
  code: string | null;
  locale: string;
};

/** Display-only currencies — no FX conversion. */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { id: "USD", label: "USD ($)", code: "USD", locale: "en-US" },
  { id: "EUR", label: "EUR (€)", code: "EUR", locale: "de-DE" },
  { id: "GBP", label: "GBP (£)", code: "GBP", locale: "en-GB" },
  { id: "PKR", label: "PKR (Rs)", code: "PKR", locale: "en-IN" },
  { id: "INR", label: "INR (₹)", code: "INR", locale: "en-IN" },
  { id: "AED", label: "AED", code: "AED", locale: "en-AE" },
  { id: "SAR", label: "SAR", code: "SAR", locale: "en-SA" },
  { id: "CAD", label: "CAD ($)", code: "CAD", locale: "en-CA" },
  { id: "AUD", label: "AUD ($)", code: "AUD", locale: "en-AU" },
  { id: "NONE", label: "No symbol", code: null, locale: "en-US" },
];

export function getCurrency(id: string): CurrencyOption {
  return CURRENCY_OPTIONS.find((c) => c.id === id) ?? CURRENCY_OPTIONS[0]!;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(
  amount: number,
  currencyId: string,
  options?: { maximumFractionDigits?: number },
): string {
  const currency = getCurrency(currencyId);
  const digits = options?.maximumFractionDigits ?? 2;
  if (!currency.code) {
    return new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  }
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function parseWhole(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}
