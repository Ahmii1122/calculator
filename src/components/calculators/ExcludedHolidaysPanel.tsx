"use client";

import { format, parseISO } from "date-fns";
import type { HolidayRecord } from "@/lib/utils/business-days";

type ExcludedHolidaysPanelProps = {
  excluded: HolidayRecord[];
  noEffect: HolidayRecord[];
  arithmeticLine: string;
  countrySelected: boolean;
};

function weekdayLabel(ymd: string): string {
  try {
    return format(parseISO(ymd), "EEE");
  } catch {
    return "";
  }
}

function notesFor(h: HolidayRecord): string {
  const notes: string[] = [];
  if (h.substitute) notes.push("observed day");
  if (h.lunar) notes.push("date may vary by a day");
  if (h.type === "custom") notes.push("custom day off");
  return notes.join("; ");
}

/**
 * Collapsible excluded-holidays table shared by business-day result panels.
 */
export function ExcludedHolidaysPanel({
  excluded,
  noEffect,
  arithmeticLine,
  countrySelected,
}: ExcludedHolidaysPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] leading-relaxed text-zinc-700">{arithmeticLine}</p>

      {(countrySelected || excluded.length > 0 || noEffect.length > 0) && (
        <>
          <details className="rounded-lg border border-border/70 bg-background/60">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              Excluded holidays ({excluded.length})
            </summary>
            <div className="overflow-x-auto px-3 pb-3">
              {excluded.length === 0 ? (
                <p className="text-[12px] text-zinc-700">
                  No holidays fell on working days in this range.
                </p>
              ) : (
                <table className="min-w-full border-collapse text-left text-[12px] text-foreground">
                  <caption className="sr-only">
                    Holidays excluded from the business-day count
                  </caption>
                  <thead>
                    <tr className="border-b border-border/80">
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Date
                      </th>
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Weekday
                      </th>
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Name
                      </th>
                      <th scope="col" className="py-2 font-semibold">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {excluded.map((h) => (
                      <tr
                        key={`${h.date}-${h.name}`}
                        className="border-b border-border/40"
                      >
                        <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">
                          {h.date}
                        </td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">
                          {weekdayLabel(h.date)}
                        </td>
                        <td className="py-1.5 pr-3">{h.name}</td>
                        <td className="py-1.5 text-zinc-700">{notesFor(h)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>
          <p className="text-[12px] text-zinc-700">
            Holidays on non-working days (no effect): {noEffect.length}
          </p>
        </>
      )}
    </div>
  );
}
