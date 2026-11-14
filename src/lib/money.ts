/** Parse money values like "$1,240.00", "(45.00)", "1240", 1240 into a number of USD. */
export function toUsd(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? round2(value) : null;
  let s = String(value).trim();
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  s = s.replace(/[$,\s]|USD/gi, "");
  if (!/^\d*\.?\d+$/.test(s)) return null;
  const n = parseFloat(s);
  return round2(negative ? -n : n);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Amounts are compared with a one-cent tolerance. */
export function moneyEq(a: number | null | undefined, b: number | null | undefined, tolerance = 0.01): boolean {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tolerance;
}

export function formatUsd(n: number, cents = true): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}
