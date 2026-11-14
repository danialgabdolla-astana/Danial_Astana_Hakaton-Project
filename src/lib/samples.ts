import { analysisIdFor } from "./hash";
import { runRules } from "./rules";
import { sampleBill, sampleEob, surpriseBill, surpriseEob } from "./sample-data";
import type { Analysis, BillDoc, EobDoc } from "./schemas";

/**
 * The two demo cases. Their results are computed by the same rules engine from the same data the sample
 * PDFs are drawn from (scripts/make-samples.ts writes them to public/samples/*.analysis.json, and
 * tests/samples.test.ts fails if those files drift). Server-only (uses node:crypto).
 */
export const SAMPLES = {
  er: { bill: sampleBill, eob: sampleEob },
  anesthesia: { bill: surpriseBill, eob: surpriseEob },
} as const;

export type SampleKind = keyof typeof SAMPLES;

export function sampleAnalysis(kind: SampleKind): Analysis {
  const { bill, eob } = SAMPLES[kind];
  const { flags, summary, matches } = runRules(bill, [eob], {});
  return {
    analysisId: analysisIdFor({ bill, eobs: [eob] }),
    createdAt: "2026-11-15T00:00:00.000Z",
    bill,
    eobs: [eob],
    context: {},
    matches,
    flags,
    summary,
    sample: kind,
  };
}

let ids: Set<string> | null = null;

/** True when these documents are exactly one of the demo cases (which are unlocked for free). */
export function isSampleCase(bill: BillDoc, eobs: EobDoc[]): boolean {
  ids ??= new Set((Object.keys(SAMPLES) as SampleKind[]).map((k) => sampleAnalysis(k).analysisId));
  return ids.has(analysisIdFor({ bill, eobs }));
}
