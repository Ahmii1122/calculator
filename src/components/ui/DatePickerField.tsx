"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { parseDateInput, toDateInputValue } from "@/lib/date-span";

type DatePickerFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  /** Extra controls shown beside the label (e.g. day badge, Today) */
  labelAccessory?: ReactNode;
};

/**
 * Modern popover date picker styled for Calculator Hub (Date & Time blue).
 * Value stays as yyyy-MM-dd for compatibility with existing calculator logic.
 */
export function DatePickerField({
  id,
  label,
  value,
  onChange,
  required,
  labelAccessory,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = parseDateInput(value) ?? undefined;

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function selectDate(date: Date | undefined) {
    if (!date) {
      onChange("");
      return;
    }
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  const display = selected ? format(selected, "MMM d, yyyy") : "Pick a date";

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
          {label}{" "}
          {required && <span className="text-cat-date">*</span>}
        </label>
        {labelAccessory}
      </div>

      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-left text-[14px] text-foreground outline-none transition hover:border-cat-date/40 focus:border-cat-date focus:bg-panel focus:ring-2 focus:ring-cat-date/20"
      >
        <CalendarIcon
          className="size-4 shrink-0 text-cat-date"
          aria-hidden="true"
        />
        <span className={selected ? "tabular-nums" : "text-muted"}>
          {display}
        </span>
      </button>

      {/* Keep a native-ish value for forms / SEO tooling without showing the OS picker */}
      <input type="hidden" name={id} value={value} required={required} readOnly />

      {open && (
        <div
          id={listboxId}
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()}`}
          className="absolute top-full left-0 z-50 mt-2 w-[min(100%,20rem)] rounded-xl border border-border/80 bg-panel p-3 shadow-card"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={selectDate}
            defaultMonth={selected}
            showOutsideDays
            weekStartsOn={0}
            classNames={{
              root: "w-full",
              months: "relative",
              month: "w-full space-y-3",
              month_caption:
                "relative flex h-9 items-center justify-center px-10",
              caption_label: "text-sm font-semibold text-foreground",
              nav: "absolute inset-x-0 top-0 flex items-center justify-between px-0",
              button_previous:
                "inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-cat-date-soft hover:text-cat-date",
              button_next:
                "inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-cat-date-soft hover:text-cat-date",
              chevron: "hidden",
              month_grid: "w-full border-collapse",
              weekdays: "grid grid-cols-7",
              weekday:
                "flex h-8 items-center justify-center text-[11px] font-medium text-muted",
              week: "mt-0.5 grid grid-cols-7",
              day: "relative p-0 text-center",
              day_button:
                "inline-flex size-9 items-center justify-center rounded-lg text-[13px] font-medium text-foreground transition hover:bg-cat-date-soft hover:text-cat-date focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-date/30",
              selected:
                "[&>button]:bg-cat-date [&>button]:text-white [&>button]:hover:bg-cat-date [&>button]:hover:text-white",
              today:
                "[&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-cat-date/40",
              outside: "[&>button]:text-muted/45 [&>button]:hover:text-muted",
              disabled: "[&>button]:opacity-40 [&>button]:hover:bg-transparent",
              hidden: "invisible",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-4" aria-hidden="true" />
                ),
            }}
          />

          <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
            <button
              type="button"
              className="text-[12px] font-medium text-muted transition hover:text-foreground"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-[12px] font-semibold text-cat-date hover:underline"
              onClick={() => selectDate(new Date())}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
