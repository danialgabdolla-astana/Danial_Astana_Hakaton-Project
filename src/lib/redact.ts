import type { BillDoc, EobDoc } from "./schemas";

/** "000-58-4471" -> "****4471" */
export function maskRef(ref: string | null | undefined): string {
  const alnum = String(ref ?? "").replace(/[^A-Za-z0-9]/g, "");
  if (!alnum) return "****";
  return `****${alnum.slice(-4)}`;
}

const PATTERNS: [RegExp, string][] = [
  [/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]"],
  [/\b(DOB|D\.O\.B\.|date of birth)[:\s]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/gi, "$1 [DOB]"],
  [/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, "[PHONE]"],
  [/\b\d{8,}\b/g, "[ID]"],
  [/\b\d{1,5}\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+(St|Street|Ave|Avenue|Rd|Road|Ln|Lane|Dr|Drive|Blvd|Ct|Court|Way)\b\.?/g, "[ADDRESS]"],
];

/** Defense in depth: the extraction prompt already asks the model to redact; this catches what slips through. */
export function scrub(text: string): string {
  return PATTERNS.reduce((s, [re, rep]) => s.replace(re, rep), text);
}

/** Masks identifiers, scrubs free text and assigns stable line ids (B1.., E1..). */
export function redactAndNumber(bill: BillDoc, eobs: EobDoc[]): { bill: BillDoc; eobs: EobDoc[] } {
  const cleanBill: BillDoc = {
    ...bill,
    providerName: scrub(bill.providerName),
    accountRef: maskRef(bill.accountRef),
    lines: bill.lines.map((l, i) => ({ ...l, id: `B${i + 1}`, description: scrub(l.description) })),
  };
  let n = 0;
  const cleanEobs: EobDoc[] = eobs.map((e) => ({
    ...e,
    insurerName: scrub(e.insurerName),
    providerName: e.providerName ? scrub(e.providerName) : null,
    claimRef: maskRef(e.claimRef),
    lines: e.lines.map((l) => ({ ...l, id: `E${++n}`, description: scrub(l.description) })),
  }));
  return { bill: cleanBill, eobs: cleanEobs };
}
