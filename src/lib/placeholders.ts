/**
 * The letter is written with [Bracketed] placeholders because personal details are
 * removed before anything reaches the AI. The user fills them in here, in the browser.
 */

const PLACEHOLDER = /\[([A-Za-z][A-Za-z0-9 /&'.-]{0,40})\]/g;

/** Unique placeholder names in order of first appearance, e.g. ["Date", "Your name"]. */
export function findPlaceholders(...texts: string[]): string[] {
  const seen = new Set<string>();
  for (const t of texts) for (const m of t.matchAll(PLACEHOLDER)) seen.add(m[1]);
  return [...seen];
}

/** Replace every filled-in placeholder; unfilled ones stay as [brackets] so nothing is lost. */
export function fillPlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER, (whole, name: string) => {
    const v = values[name]?.trim();
    return v ? v : whole;
  });
}

/** Long US-style date, e.g. "November 15, 2026". */
export function letterDate(d = new Date()): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Fields that need more than one line. */
export const MULTILINE = new Set(["Your address", "Provider billing address", "Insurer address"]);
