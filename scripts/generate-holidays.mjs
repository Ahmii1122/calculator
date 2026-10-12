/**
 * Build-time generator for static holiday JSON under public/data/holidays/.
 * Uses date-holidays (devDependency only) — never imported by app code.
 *
 * API (from date-holidays README + runtime probe):
 * - new Holidays() / new Holidays(country, state?)
 * - getCountries() → { CODE: localName }
 * - getStates(country) → { CODE: name } | falsy
 * - setLanguages('en') with English fallback
 * - getHolidays(year) → [{ date, start, end, name, type, substitute?, rule?, note? }]
 * - types: public | bank | school | optional | observance
 * - date is local "YYYY-MM-DD HH:mm:ss" — we store YYYY-MM-DD only (no TZ shift)
 */

import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Holidays from "date-holidays";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "data", "holidays");

const REGION_COUNTRIES = ["US", "CA", "AU", "GB", "DE", "IN"];
const MIN_COUNTRIES = 150;

/** Islamic / Hebrew / Chinese tokens used in date-holidays rule strings. */
const LUNAR_RULE_RE =
  /\b(ramadan|shawwal|muharram|rajab|rabi|jumada|dhu al-|sha'?ban|hebrew|chinese|lunar|tishrei|nisan|kislev|sivan|elul|tevet|shevat|adar|iyyar|av|rosh|pesach|sukkot|hanukkah|passover)\b/i;

function isLunarRule(rule) {
  return typeof rule === "string" && LUNAR_RULE_RE.test(rule);
}

function shortDate(dateStr) {
  return String(dateStr).slice(0, 10);
}

function displayName(code, libraryName) {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    const name = dn.of(code);
    if (name && name !== code) return name;
  } catch {
    // ignore
  }
  return libraryName || code;
}

function yearWindow(now = new Date()) {
  const y = now.getUTCFullYear();
  return { firstYear: y - 2, lastYear: y + 5 };
}

function collectHolidays(hd, firstYear, lastYear) {
  const byKey = new Map();
  let hasLunar = false;

  for (let year = firstYear; year <= lastYear; year++) {
    let list = [];
    try {
      list = hd.getHolidays(year) || [];
    } catch {
      continue;
    }
    for (const h of list) {
      const date = shortDate(h.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const lunar = isLunarRule(h.rule);
      if (lunar) hasLunar = true;
      const key = `${date}|${h.name}|${h.type}`;
      if (byKey.has(key)) continue;
      const entry = { d: date, n: h.name, t: h.type };
      if (h.substitute) entry.s = 1;
      if (lunar) entry.l = 1;
      byKey.set(key, entry);
    }
  }

  return {
    holidays: [...byKey.values()].sort((a, b) =>
      a.d === b.d ? a.n.localeCompare(b.n) : a.d.localeCompare(b.d),
    ),
    hasLunar,
  };
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data));
}

function main() {
  const { firstYear, lastYear } = yearWindow();
  const generatedAt = new Date().toISOString();

  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const probe = new Holidays();
  const rawCountries = probe.getCountries() || {};
  const countryCodes = Object.keys(rawCountries);

  const countries = countryCodes
    .map((code) => ({
      code,
      name: displayName(code, rawCountries[code]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  writeJson(join(OUT, "countries.json"), {
    meta: { generatedAt, firstYear, lastYear, count: countries.length },
    countries,
  });

  const regionReport = {};
  let generatedFiles = 1; // countries.json
  const skipped = [];
  let largest = { path: "", size: 0 };
  let totalBytes = 0;

  function trackFile(relPath, absPath) {
    const size = statSync(absPath).size;
    totalBytes += size;
    generatedFiles += 1;
    if (size > largest.size) largest = { path: relPath, size };
    if (size === 0) throw new Error(`Empty holiday file: ${relPath}`);
  }

  trackFile("countries.json", join(OUT, "countries.json"));

  for (const code of countryCodes) {
    try {
      const hd = new Holidays(code);
      hd.setLanguages("en");
      const { holidays, hasLunar } = collectHolidays(hd, firstYear, lastYear);
      const file = `${code}.json`;
      const abs = join(OUT, file);
      writeJson(abs, {
        meta: {
          generatedAt,
          firstYear,
          lastYear,
          code,
          hasLunar: hasLunar ? 1 : 0,
        },
        h: holidays,
      });
      trackFile(file, abs);

      if (REGION_COUNTRIES.includes(code)) {
        const states = hd.getStates(code) || {};
        const stateCodes = Object.keys(states);
        regionReport[code] = {
          count: stateCodes.length,
          sample: stateCodes.slice(0, 5),
        };
        for (const state of stateCodes) {
          try {
            const hdState = new Holidays(code, state);
            hdState.setLanguages("en");
            const collected = collectHolidays(hdState, firstYear, lastYear);
            const regionCode = String(state).toUpperCase();
            const rFile = `${code}-${regionCode}.json`;
            const rAbs = join(OUT, rFile);
            writeJson(rAbs, {
              meta: {
                generatedAt,
                firstYear,
                lastYear,
                code,
                region: regionCode,
                hasLunar: collected.hasLunar ? 1 : 0,
              },
              h: collected.holidays,
            });
            trackFile(rFile, rAbs);
          } catch (err) {
            console.warn(`Skip region ${code}-${state}:`, err.message || err);
          }
        }
      }
    } catch (err) {
      skipped.push(code);
      console.warn(`Skip country ${code}:`, err.message || err);
    }
  }

  if (countries.length < MIN_COUNTRIES) {
    throw new Error(
      `Holiday generation failed: only ${countries.length} countries (need ≥ ${MIN_COUNTRIES})`,
    );
  }

  const regionsIndex = {};
  for (const code of REGION_COUNTRIES) {
    const files = readdirSync(OUT).filter(
      (f) => f.startsWith(`${code}-`) && f.endsWith(".json"),
    );
    let states = {};
    try {
      states = new Holidays(code).getStates(code) || {};
    } catch {
      states = {};
    }
    regionsIndex[code] = files.map((f) => {
      const region = f.slice(code.length + 1, -5);
      const match = Object.entries(states).find(
        ([k]) => String(k).toUpperCase() === region,
      );
      return { code: region, name: match ? match[1] : region };
    });
  }
  writeJson(join(OUT, "regions.json"), {
    meta: { generatedAt },
    regions: regionsIndex,
  });
  trackFile("regions.json", join(OUT, "regions.json"));

  function readCountry(code) {
    return JSON.parse(readFileSync(join(OUT, `${code}.json`), "utf8"));
  }

  const us = readCountry("US");
  const gb = readCountry("GB");
  const pk = readCountry("PK");

  const spot = {
    US_july4: us.h
      .filter((h) => h.d.includes("-07-04") || /independence/i.test(h.n))
      .slice(0, 8),
    GB_dec25: gb.h.filter((h) => h.d.includes("-12-25")).slice(0, 4),
    PK_aug14: pk.h
      .filter((h) => h.d.includes("-08-14") || /independence/i.test(h.n))
      .slice(0, 4),
    firstYearCounts: {
      US: us.h.filter((h) => h.d.startsWith(String(firstYear))).length,
      GB: gb.h.filter((h) => h.d.startsWith(String(firstYear))).length,
      PK: pk.h.filter((h) => h.d.startsWith(String(firstYear))).length,
    },
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        countries: countries.length,
        files: generatedFiles,
        skipped,
        yearWindow: { firstYear, lastYear },
        totalBytes,
        totalKB: Math.round(totalBytes / 1024),
        largest,
        regionReport,
        regionFileCounts: Object.fromEntries(
          Object.entries(regionsIndex).map(([k, v]) => [k, v.length]),
        ),
        spot,
      },
      null,
      2,
    ),
  );
}

main();
