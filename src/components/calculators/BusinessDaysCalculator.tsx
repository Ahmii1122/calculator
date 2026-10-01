"use client";

import { DaysBetweenDatesCalculator } from "@/components/calculators/DaysBetweenDatesCalculator";

/** Business days as the primary outcome; shares `calculateDateSpan` with Days Between Dates. */
export function BusinessDaysCalculator() {
  return <DaysBetweenDatesCalculator variant="business-days" />;
}
