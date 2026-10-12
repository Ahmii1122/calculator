import type { CompactHoliday } from "@/lib/utils/business-days";

export type CountryOption = { code: string; name: string };

export type RegionOption = { code: string; name: string };

export type HolidayFileMeta = {
  generatedAt: string;
  firstYear: number;
  lastYear: number;
  code?: string;
  region?: string;
  hasLunar?: number;
};

export type HolidayFile = {
  meta: HolidayFileMeta;
  h: CompactHoliday[];
};

export type CountriesFile = {
  meta: HolidayFileMeta & { count: number };
  countries: CountryOption[];
};

export type RegionsFile = {
  meta: { generatedAt: string };
  regions: Record<string, RegionOption[]>;
};

const fileCache = new Map<string, HolidayFile>();
const countriesCache: { value: CountriesFile | null } = { value: null };
const regionsCache: { value: RegionsFile | null } = { value: null };

/** Popular country codes for the optgroup (filtered to those present). */
export const POPULAR_COUNTRY_CODES = [
  "PK",
  "IN",
  "US",
  "GB",
  "AE",
  "SA",
  "CA",
  "AU",
  "DE",
] as const;

/** Holiday types we expose in the UI (must exist in generated data). */
export const HOLIDAY_TYPE_OPTIONS = [
  { id: "public", label: "Public holidays", defaultOn: true },
  { id: "bank", label: "Bank holidays", defaultOn: false },
] as const;

function cacheKey(code: string, region?: string | null): string {
  return region ? `${code}-${region}` : code;
}

export async function loadCountries(
  signal?: AbortSignal,
): Promise<CountriesFile> {
  if (countriesCache.value) return countriesCache.value;
  const res = await fetch("/data/holidays/countries.json", { signal });
  if (!res.ok) throw new Error("Could not load country list.");
  const data = (await res.json()) as CountriesFile;
  countriesCache.value = data;
  return data;
}

export async function loadRegionsIndex(
  signal?: AbortSignal,
): Promise<RegionsFile> {
  if (regionsCache.value) return regionsCache.value;
  const res = await fetch("/data/holidays/regions.json", { signal });
  if (!res.ok) throw new Error("Could not load regions.");
  const data = (await res.json()) as RegionsFile;
  regionsCache.value = data;
  return data;
}

/**
 * Fetch a country (or country-region) holiday file.
 * Module-level Map caches successful responses; callers should abort stale requests.
 */
export async function loadHolidayFile(
  code: string,
  region?: string | null,
  signal?: AbortSignal,
): Promise<HolidayFile> {
  const key = cacheKey(code, region);
  const cached = fileCache.get(key);
  if (cached) return cached;

  const path = region
    ? `/data/holidays/${code}-${region}.json`
    : `/data/holidays/${code}.json`;
  const res = await fetch(path, { signal });
  if (!res.ok) throw new Error("Could not load holiday data.");
  const data = (await res.json()) as HolidayFile;
  if (!data?.h || !data?.meta) throw new Error("Holiday file was empty.");
  fileCache.set(key, data);
  return data;
}

export function rangeOutsideHolidayYears(
  startYmd: string,
  endYmd: string,
  firstYear: number,
  lastYear: number,
): boolean {
  const years = [startYmd, endYmd]
    .filter(Boolean)
    .map((d) => Number(d.slice(0, 4)))
    .filter((y) => Number.isFinite(y));
  if (years.length === 0) return false;
  return years.some((y) => y < firstYear || y > lastYear);
}
