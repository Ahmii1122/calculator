/**
 * Pure unit-conversion data and math for the Unit Converter.
 *
 * Structure: category → units → factor to a shared base unit.
 * Temperature uses dedicated functions (not a linear factor).
 *
 * Future categories (Area, Speed, Pressure) can follow the same
 * `UnitCategoryDefinition` shape without changing the convert API.
 */

export type UnitCategoryId = "length" | "weight" | "volume" | "temperature";

export type UnitDefinition = {
  id: string;
  /** Short label for selects, e.g. "cm" */
  label: string;
  /** Longer name for results, e.g. "centimeters" */
  name: string;
  /**
   * Multiply by this to reach the category base unit.
   * Unused for temperature (see convertTemperature).
   */
  toBase: number;
};

export type UnitCategoryDefinition = {
  id: UnitCategoryId;
  label: string;
  /** Human-readable base unit name (for docs / future debugging). */
  baseUnit: string;
  /** When true, UI should show a US customary note. */
  usesUsCustomary?: boolean;
  allowsNegative: boolean;
  units: UnitDefinition[];
};

/**
 * Length — base: meters.
 * Area / Speed / Pressure can be added later with the same pattern.
 */
const LENGTH: UnitCategoryDefinition = {
  id: "length",
  label: "Length",
  baseUnit: "meters",
  allowsNegative: false,
  units: [
    { id: "mm", label: "mm", name: "millimeters", toBase: 0.001 },
    { id: "cm", label: "cm", name: "centimeters", toBase: 0.01 },
    { id: "m", label: "m", name: "meters", toBase: 1 },
    { id: "km", label: "km", name: "kilometers", toBase: 1000 },
    { id: "in", label: "in", name: "inches", toBase: 0.0254 },
    { id: "ft", label: "ft", name: "feet", toBase: 0.3048 },
    { id: "yd", label: "yd", name: "yards", toBase: 0.9144 },
    { id: "mi", label: "mi", name: "miles", toBase: 1609.344 },
  ],
};

/** Weight / mass — base: kilograms. */
const WEIGHT: UnitCategoryDefinition = {
  id: "weight",
  label: "Weight / Mass",
  baseUnit: "kilograms",
  allowsNegative: false,
  units: [
    { id: "mg", label: "mg", name: "milligrams", toBase: 1e-6 },
    { id: "g", label: "g", name: "grams", toBase: 0.001 },
    { id: "kg", label: "kg", name: "kilograms", toBase: 1 },
    { id: "t", label: "t", name: "metric tons", toBase: 1000 },
    { id: "oz", label: "oz", name: "ounces", toBase: 0.028349523125 },
    { id: "lb", label: "lb", name: "pounds", toBase: 0.45359237 },
    { id: "st", label: "st", name: "stone", toBase: 6.35029318 },
  ],
};

/**
 * Volume — base: liters.
 * Cooking / liquid units default to US customary (not Imperial UK).
 */
const VOLUME: UnitCategoryDefinition = {
  id: "volume",
  label: "Volume",
  baseUnit: "liters",
  usesUsCustomary: true,
  allowsNegative: false,
  units: [
    { id: "ml", label: "ml", name: "milliliters", toBase: 0.001 },
    { id: "l", label: "L", name: "liters", toBase: 1 },
    { id: "m3", label: "m³", name: "cubic meters", toBase: 1000 },
    {
      id: "tsp",
      label: "tsp (US)",
      name: "US teaspoons",
      toBase: 0.00492892159375,
    },
    {
      id: "tbsp",
      label: "tbsp (US)",
      name: "US tablespoons",
      toBase: 0.01478676478125,
    },
    {
      id: "floz",
      label: "fl oz (US)",
      name: "US fluid ounces",
      toBase: 0.0295735295625,
    },
    {
      id: "cup",
      label: "cup (US)",
      name: "US cups",
      toBase: 0.2365882365,
    },
    {
      id: "pt",
      label: "pt (US)",
      name: "US pints",
      toBase: 0.473176473,
    },
    {
      id: "qt",
      label: "qt (US)",
      name: "US quarts",
      toBase: 0.946352946,
    },
    {
      id: "gal",
      label: "gal (US)",
      name: "US gallons",
      toBase: 3.785411784,
    },
  ],
};

/** Temperature — converted via formulas, not toBase. */
const TEMPERATURE: UnitCategoryDefinition = {
  id: "temperature",
  label: "Temperature",
  baseUnit: "celsius",
  allowsNegative: true,
  units: [
    { id: "c", label: "°C", name: "Celsius", toBase: 1 },
    { id: "f", label: "°F", name: "Fahrenheit", toBase: 1 },
    { id: "k", label: "K", name: "Kelvin", toBase: 1 },
  ],
};

export const UNIT_CATEGORIES: UnitCategoryDefinition[] = [
  LENGTH,
  WEIGHT,
  VOLUME,
  TEMPERATURE,
];

export function getCategory(id: UnitCategoryId): UnitCategoryDefinition {
  const found = UNIT_CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category: ${id}`);
  return found;
}

export function getUnit(
  categoryId: UnitCategoryId,
  unitId: string,
): UnitDefinition | undefined {
  return getCategory(categoryId).units.find((u) => u.id === unitId);
}

/** Parse a decimal input string; empty → null. */
export function parseUnitInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function celsiusFrom(value: number, fromId: string): number {
  switch (fromId) {
    case "c":
      return value;
    case "f":
      return ((value - 32) * 5) / 9;
    case "k":
      return value - 273.15;
    default:
      return value;
  }
}

function celsiusTo(celsius: number, toId: string): number {
  switch (toId) {
    case "c":
      return celsius;
    case "f":
      return (celsius * 9) / 5 + 32;
    case "k":
      return celsius + 273.15;
    default:
      return celsius;
  }
}

export function convertTemperature(
  value: number,
  fromId: string,
  toId: string,
): number {
  if (fromId === toId) return value;
  return celsiusTo(celsiusFrom(value, fromId), toId);
}

export function convertLinear(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
): number {
  if (from.id === to.id) return value;
  const inBase = value * from.toBase;
  return inBase / to.toBase;
}

export type ConversionSuccess = {
  ok: true;
  value: number;
  display: string;
  fromUnit: UnitDefinition;
  toUnit: UnitDefinition;
  /** e.g. "1 cm = 0.393701 in" */
  formula: string;
};

export type ConversionFailure = {
  ok: false;
  error: "empty" | "invalid" | "negative_not_allowed" | "below_absolute_zero";
  message: string;
};

export type ConversionResult = ConversionSuccess | ConversionFailure;

/** Round for display: adaptive decimals, avoid -0 and float noise. */
export function roundConversionValue(value: number): number {
  if (!Number.isFinite(value)) return value;
  const abs = Math.abs(value);
  let decimals: number;
  if (abs === 0) decimals = 0;
  else if (abs >= 1000) decimals = 4;
  else if (abs >= 1) decimals = 6;
  else if (abs >= 0.001) decimals = 8;
  else decimals = 10;

  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatConversionNumber(value: number): string {
  const rounded = roundConversionValue(value);
  const abs = Math.abs(rounded);
  let maxFrac: number;
  if (abs === 0) maxFrac = 0;
  else if (abs >= 1000) maxFrac = 2;
  else if (abs >= 100) maxFrac = 3;
  else if (abs >= 1) maxFrac = 4;
  else if (abs >= 0.01) maxFrac = 6;
  else maxFrac = 8;

  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  });
}

function buildFormula(
  from: UnitDefinition,
  to: UnitDefinition,
  categoryId: UnitCategoryId,
): string {
  if (from.id === to.id) {
    return `1 ${from.label} = 1 ${to.label}`;
  }

  if (categoryId === "temperature") {
    if (from.id === "c" && to.id === "f") {
      return "°F = °C × 9/5 + 32";
    }
    if (from.id === "f" && to.id === "c") {
      return "°C = (°F − 32) × 5/9";
    }
    if (from.id === "c" && to.id === "k") {
      return "K = °C + 273.15";
    }
    if (from.id === "k" && to.id === "c") {
      return "°C = K − 273.15";
    }
    if (from.id === "f" && to.id === "k") {
      return "K = (°F − 32) × 5/9 + 273.15";
    }
    if (from.id === "k" && to.id === "f") {
      return "°F = (K − 273.15) × 9/5 + 32";
    }
  }

  const one = convertLinear(1, from, to);
  return `1 ${from.label} = ${formatConversionNumber(one)} ${to.label}`;
}

/**
 * Convert a numeric value between two units in the same category.
 */
export function convertUnits(options: {
  categoryId: UnitCategoryId;
  fromUnitId: string;
  toUnitId: string;
  rawValue: string;
}): ConversionResult {
  const { categoryId, fromUnitId, toUnitId, rawValue } = options;
  const category = getCategory(categoryId);
  const from = getUnit(categoryId, fromUnitId);
  const to = getUnit(categoryId, toUnitId);

  if (!from || !to) {
    return {
      ok: false,
      error: "invalid",
      message: "Choose valid from and to units.",
    };
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a number to convert.",
    };
  }

  const value = parseUnitInput(rawValue);
  if (value === null) {
    return {
      ok: false,
      error: "invalid",
      message: "Enter a valid number.",
    };
  }

  if (!category.allowsNegative && value < 0) {
    return {
      ok: false,
      error: "negative_not_allowed",
      message: `${category.label} values cannot be negative.`,
    };
  }

  // Kelvin cannot go below absolute zero
  if (categoryId === "temperature") {
    const asKelvin = convertTemperature(value, fromUnitId, "k");
    if (asKelvin < 0) {
      return {
        ok: false,
        error: "below_absolute_zero",
        message: "Temperature cannot be below absolute zero (0 K).",
      };
    }
  }

  const result =
    categoryId === "temperature"
      ? convertTemperature(value, fromUnitId, toUnitId)
      : convertLinear(value, from, to);

  return {
    ok: true,
    value: result,
    display: formatConversionNumber(result),
    fromUnit: from,
    toUnit: to,
    formula: buildFormula(from, to, categoryId),
  };
}

/** Reference rows for the Common Conversions content table. */
export const COMMON_CONVERSIONS: {
  from: string;
  to: string;
  factor: string;
  category: string;
}[] = [
  { from: "1 cm", to: "inches", factor: "0.393701 in", category: "Length" },
  { from: "1 inch", to: "centimeters", factor: "2.54 cm", category: "Length" },
  { from: "1 m", to: "feet", factor: "3.28084 ft", category: "Length" },
  { from: "1 mile", to: "kilometers", factor: "1.60934 km", category: "Length" },
  { from: "1 km", to: "miles", factor: "0.621371 mi", category: "Length" },
  { from: "1 kg", to: "pounds", factor: "2.20462 lb", category: "Weight" },
  { from: "1 lb", to: "kilograms", factor: "0.453592 kg", category: "Weight" },
  { from: "1 oz", to: "grams", factor: "28.3495 g", category: "Weight" },
  {
    from: "1 L",
    to: "US gallons",
    factor: "0.264172 gal",
    category: "Volume",
  },
  {
    from: "1 US gal",
    to: "liters",
    factor: "3.78541 L",
    category: "Volume",
  },
  {
    from: "1 US cup",
    to: "milliliters",
    factor: "236.588 ml",
    category: "Volume",
  },
  {
    from: "0 °C",
    to: "Fahrenheit",
    factor: "32 °F",
    category: "Temperature",
  },
];
