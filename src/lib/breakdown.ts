import { CLAIM_LEVEL, disputableTotal } from "./rules";
import type { Flag } from "./schemas";

/**
 * How the disputable total is made up, mirroring `disputableTotal`: claim-level flags (bill vs. EOB totals)
 * and line-level flags describe the same dollars from two angles, so only one side is counted.
 *
 * - `counted`: the flags whose amounts add up to the total ("$480 charged twice + $165 not on your EOB").
 * - `status`: for every other flag with an amount, whether its dollars are already part of the total
 *   ("included") or are a separate question that isn't added ("notAdded").
 */
export type Breakdown = {
  total: number;
  mode: "lines" | "claim" | "none";
  counted: Flag[];
  status: Record<string, "counted" | "included" | "notAdded">;
};

export function breakdownOf(flags: Flag[]): Breakdown {
  const eligible = flags.filter((f) => f.confidence !== "low" && f.amountAtStake > 0);
  const claim = eligible.filter((f) => CLAIM_LEVEL.includes(f.ruleId));
  const lines = eligible.filter((f) => !CLAIM_LEVEL.includes(f.ruleId));
  const lineSum = lines.reduce((s, f) => s + f.amountAtStake, 0);
  const topClaim = claim.reduce<Flag | null>((best, f) => (!best || f.amountAtStake > best.amountAtStake ? f : best), null);

  const total = disputableTotal(flags);
  let mode: Breakdown["mode"] = "none";
  let counted: Flag[] = [];
  if (lines.length && lineSum >= (topClaim?.amountAtStake ?? 0)) {
    mode = "lines";
    counted = lines;
  } else if (topClaim) {
    mode = "claim";
    counted = [topClaim];
  }

  const countedIds = new Set(counted.map((f) => f.id));
  const countedLines = new Set(counted.flatMap((f) => f.billLineIds));
  const status: Breakdown["status"] = {};
  for (const f of flags) {
    if (countedIds.has(f.id)) status[f.id] = "counted";
    else if (f.amountAtStake <= 0) continue;
    else if (mode === "lines") {
      // A totals-level gap is the same money as the lines; a flag on a line already counted adds nothing.
      status[f.id] = CLAIM_LEVEL.includes(f.ruleId) || f.billLineIds.some((id) => countedLines.has(id)) ? "included" : "notAdded";
    } else if (mode === "claim") {
      // Line issues explain part of the bill-vs-EOB gap; low-confidence questions are separate.
      status[f.id] = f.confidence !== "low" ? "included" : "notAdded";
    } else status[f.id] = "notAdded";
  }
  return { total, mode, counted, status };
}
