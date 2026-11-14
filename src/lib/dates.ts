const TAGS: Record<string, string> = { en: "en-US", es: "es-US", fr: "fr-FR" };
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-09-14" → "Sep 14, 2026" (or "14 sept 2026" in French). Anything that isn't an ISO date is returned as is. */
export function formatDate(iso: string | null | undefined, locale = "en"): string {
  if (!iso) return "";
  const m = ISO.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString(TAGS[locale] ?? "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Rewrites every ISO date inside a text in US style ("Sep 14, 2026"). */
export function usDatesInText(text: string): string {
  return text.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (d) => formatDate(d, "en"));
}
