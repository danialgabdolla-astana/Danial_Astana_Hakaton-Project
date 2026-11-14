import type { RecurringCandidate } from "./types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Builds an .ics file with a monthly reminder 2 days before each recurring charge. */
export function buildRenewalCalendar(items: (RecurringCandidate & { lastDate: string })[]): string {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T000000Z`;
  const events = items.map((r, i) => {
    const last = new Date(r.lastDate + "T12:00:00");
    const next = new Date(last.getFullYear(), last.getMonth() + 1, Math.max(1, last.getDate() - 2));
    const d = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
    return [
      "BEGIN:VEVENT",
      `UID:financebro-${i}-${d}@financebro.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      "RRULE:FREQ=MONTHLY",
      `SUMMARY:${r.merchant} renews in 2 days ($${r.lastAmount.toFixed(2)})`,
      "DESCRIPTION:Still using it? If not, cancel before it charges. — FinanceBro",
      "END:VEVENT",
    ].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FinanceBro//Renewals//EN", ...events, "END:VCALENDAR"].join("\r\n");
}
