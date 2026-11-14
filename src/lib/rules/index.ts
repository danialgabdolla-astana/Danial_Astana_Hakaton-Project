import { baseCode, matchLines, tokens } from "../match";
import { round2 } from "../money";
import type { BillDoc, BillLine, EobDoc, EobLine, Flag, PlanContext, RuleId, Summary } from "../schemas";
import { duplicateCharge } from "./duplicate";
import { balanceBillingInNetwork, billExceedsEob, noInsuranceApplied, notItemized } from "./claim";
import { lineNotOnEob, possibleSurpriseBill, possibleUnbundling } from "./lines";
import type { Rule, RuleInput } from "./types";

/** Order matters only for display: most important first. */
export const RULES: Rule[] = [
  notItemized,
  billExceedsEob,
  noInsuranceApplied,
  balanceBillingInNetwork,
  duplicateCharge,
  lineNotOnEob,
  possibleSurpriseBill,
  possibleUnbundling,
];

/** Claim-level rules describe the whole gap between the bill and the EOB. */
const CLAIM_LEVEL: RuleId[] = ["BILL_EXCEEDS_EOB", "NO_INSURANCE_APPLIED", "BALANCE_BILLING_IN_NETWORK"];

function lineKey(l: BillLine): string {
  const code = baseCode(l.code);
  if (code) return `${l.serviceDate ?? "?"}|${code}`;
  return `${l.serviceDate ?? "?"}|${[...tokens(l.description)].sort().join(" ")}|${l.billedAmount}`;
}

export function buildInput(bill: BillDoc, eobs: EobDoc[], context: PlanContext = {}): RuleInput {
  const eobLines: EobLine[] = eobs.flatMap((e) => e.lines);
  const matches = matchLines(bill.lines, eobLines);
  const byId = new Map(eobLines.map((l) => [l.id, l]));
  const matched = new Map<string, EobLine>();
  for (const m of matches) if (m.eobLineId) matched.set(m.billLineId, byId.get(m.eobLineId)!);

  const duplicateOf = new Map<string, BillLine>();
  bill.lines.forEach((line, i) => {
    if (matched.has(line.id)) return;
    const key = lineKey(line);
    const earlier = bill.lines.slice(0, i).find((o) => lineKey(o) === key);
    // Prefer pointing at the copy the insurer actually processed.
    const processed = bill.lines.find((o) => o.id !== line.id && lineKey(o) === key && matched.has(o.id));
    const original = processed ?? earlier;
    if (original) duplicateOf.set(line.id, original);
  });

  const eobTotal = round2(
    eobs.reduce((s, e) => s + (e.totalPatientResponsibility || e.lines.reduce((t, l) => t + l.patientResponsibility, 0)), 0),
  );

  return { bill, eobs, eobLines, context, matches, matched, duplicateOf, eobTotal };
}

/**
 * The amount you can dispute, counting every dollar once.
 * Claim-level flags (bill vs. EOB totals) and line-level flags (duplicates, missing lines, …) often describe
 * the same money from two angles, so we take the larger of the two rather than adding them.
 * Only high- and medium-confidence flags count.
 */
export function disputableTotal(flags: Flag[]): number {
  const counted = flags.filter((f) => f.confidence !== "low" && f.amountAtStake > 0);
  const claim = Math.max(0, ...counted.filter((f) => CLAIM_LEVEL.includes(f.ruleId)).map((f) => f.amountAtStake));
  const lines = counted.filter((f) => !CLAIM_LEVEL.includes(f.ruleId)).reduce((s, f) => s + f.amountAtStake, 0);
  return round2(Math.max(claim, lines));
}

export function runRules(bill: BillDoc, eobs: EobDoc[], context: PlanContext = {}) {
  const input = buildInput(bill, eobs, context);
  const flags: Flag[] = RULES.flatMap((rule) => rule(input)).map((f, i) => ({ ...f, id: `F${i + 1}` }));
  const summary: Summary = {
    issueCount: flags.length,
    disputableTotal: disputableTotal(flags),
    billBalance: bill.patientBalance,
    eobPatientResponsibility: input.eobTotal,
  };
  return { flags, summary, matches: input.matches };
}
