import type { BillLine, EobLine } from "./schemas";

/** "70450-26" or "70450 26" -> "70450". Codes are compared without modifiers. */
export function baseCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.toUpperCase().trim().split(/[\s\-:]+/)[0];
  return c || null;
}

/** Modifiers such as "26", "80", "AS" that follow the base code. */
export function modifiers(code: string | null | undefined): string[] {
  if (!code) return [];
  return code.toUpperCase().trim().split(/[\s\-:]+/).slice(1).filter(Boolean);
}

const STOP = new Set(["of", "the", "and", "w", "wo", "with", "without", "a", "an", "to", "for", "per", "each", "level", "dept"]);

export function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
}

/** Jaccard similarity of description tokens, 0..1. */
export function similarity(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function datesCompatible(a: string | null, b: string | null): boolean {
  return a === null || b === null || a === b;
}

export type Match = { billLineId: string; eobLineId: string | null };

/**
 * Pairs each bill line with at most one EOB line (and each EOB line with at most one bill line).
 * Pass 1: same service date + same base CPT/HCPCS code.
 * Pass 2 (no code on either side): similar description and the same billed amount,
 *         or a very similar description on its own.
 */
export function matchLines(billLines: BillLine[], eobLines: EobLine[]): Match[] {
  const used = new Set<string>();
  const result = new Map<string, string | null>(billLines.map((b) => [b.id, null]));

  for (const b of billLines) {
    const code = baseCode(b.code);
    if (!code) continue;
    const e = eobLines.find((x) => !used.has(x.id) && baseCode(x.code) === code && datesCompatible(b.serviceDate, x.serviceDate));
    if (e) {
      used.add(e.id);
      result.set(b.id, e.id);
    }
  }

  for (const b of billLines) {
    if (result.get(b.id)) continue;
    let best: { id: string; score: number } | null = null;
    for (const e of eobLines) {
      if (used.has(e.id) || !datesCompatible(b.serviceDate, e.serviceDate)) continue;
      // If both sides have codes and they differ, they are different services.
      if (baseCode(b.code) && baseCode(e.code)) continue;
      const sim = similarity(b.description, e.description);
      const sameAmount = e.billedAmount !== null && Math.abs(e.billedAmount - b.billedAmount) <= 1;
      const ok = (sim >= 0.5 && sameAmount) || sim >= 0.75;
      if (ok && (!best || sim > best.score)) best = { id: e.id, score: sim };
    }
    if (best) {
      used.add(best.id);
      result.set(b.id, best.id);
    }
  }

  return billLines.map((b) => ({ billLineId: b.id, eobLineId: result.get(b.id) ?? null }));
}
