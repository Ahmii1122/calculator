"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DayPicker, type DropdownProps } from "react-day-picker";
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
 * Styled month/year menu for DayPicker — replaces the native OS `<select>`.
 */
function ModernCaptionDropdown({
  options,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options?.find((option) => option.value === Number(value));

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [menuOpen, value]);

  function pick(nextValue: number) {
    onChange?.({
      target: { value: String(nextValue) },
    } as ChangeEvent<HTMLSelectElement>);
    setMenuOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={menuOpen}
        data-caption-menu={menuOpen ? "open" : "closed"}
        onClick={() => setMenuOpen((open) => !open)}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 text-[13px] font-semibold text-foreground transition hover:border-cat-date/40 hover:bg-cat-date-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-date/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="tabular-nums">{selected?.label ?? "—"}</span>
        <ChevronDown
          className={`size-3.5 text-muted transition ${menuOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {menuOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-full left-1/2 z-50 mt-1.5 max-h-52 w-max min-w-full -translate-x-1/2 overflow-y-auto rounded-xl border border-border/80 bg-panel py-1.5 shadow-card"
        >
          {options?.map((option) => {
            const isSelected = option.value === Number(value);
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => pick(option.value)}
                  className={`flex w-full items-center px-3 py-1.5 text-left text-[13px] tabular-nums transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? "bg-cat-date font-semibold text-white"
                      : "text-foreground hover:bg-cat-date-soft hover:text-cat-date"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Popover date picker for Calculator Hub.
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

  const startMonth = useMemo(() => {
    const year = new Date().getFullYear();
    return new Date(year - 100, 0);
  }, []);
  const endMonth = useMemo(() => {
    const year = new Date().getFullYear();
    return new Date(year + 50, 11);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Let an open caption menu close first without dismissing the calendar.
      if (wrapRef.current?.querySelector('[data-caption-menu="open"]')) return;
      setOpen(false);
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

      {/* Keep a native-ish value for forms without showing the OS picker */}
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
            startMonth={startMonth}
            endMonth={endMonth}
            captionLayout="dropdown"
            navLayout="around"
            showOutsideDays
            weekStartsOn={0}
            classNames={{
              root: "w-full",
              months: "relative",
              month: "relative w-full space-y-3",
              month_caption:
                "relative flex h-9 items-center justify-center px-10",
              dropdowns: "relative flex items-center justify-center gap-1.5",
              dropdown_root: "relative",
              nav: "hidden",
              button_previous:
                "absolute top-0 left-0 z-10 inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-cat-date-soft hover:text-cat-date",
              button_next:
                "absolute top-0 right-0 z-10 inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-cat-date-soft hover:text-cat-date",
              chevron: "size-4 text-muted",
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
              Dropdown: ModernCaptionDropdown,
              Chevron: ({ orientation, className }) => {
                const iconClass = className ?? "size-4";
                if (orientation === "left") {
                  return (
                    <ChevronLeft className={iconClass} aria-hidden="true" />
                  );
                }
                if (orientation === "right") {
                  return (
                    <ChevronRight className={iconClass} aria-hidden="true" />
                  );
                }
                return (
                  <ChevronDown
                    className={iconClass ?? "size-3.5"}
                    aria-hidden="true"
                  />
                );
              },
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
