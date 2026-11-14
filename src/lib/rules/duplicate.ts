import { round2 } from "../money";
import type { Confidence } from "../schemas";
import type { Rule } from "./types";

/**
 * DUPLICATE_CHARGE: the same service (date + code, or description + amount) appears more times on the
 * bill than on the EOB. The amount at stake is the patient's share of the extra line.
 */
export const duplicateCharge: Rule = ({ bill, matched, duplicateOf, context }) => {
  const flags = [];
  for (const line of bill.lines) {
    const original = duplicateOf.get(line.id);
    if (!original) continue;
    const eob = matched.get(original.id);

    let amount = line.billedAmount;
    let confidence: Confidence = "low";
    let basis = "the full billed amount (we couldn't find the insurer's numbers for it)";
    let basisKey = "billed";

    if (eob && (eob.deductible ?? 0) > 0 && eob.allowedAmount != null) {
      amount = eob.allowedAmount;
      confidence = "high";
      basis = "the insurer's allowed amount, because your deductible applies";
      basisKey = "deductible";
    } else if (eob && context.coinsurancePct != null) {
      amount = (eob.allowedAmount ?? line.billedAmount) * (context.coinsurancePct / 100);
      confidence = "high";
      basis = `your ${context.coinsurancePct}% coinsurance`;
      basisKey = "coinsurance";
    } else if (eob) {
      amount = eob.patientResponsibility;
      confidence = "high";
      basis = "your share on the EOB for the same service";
      basisKey = "eobShare";
    }

    flags.push({
      ruleId: "DUPLICATE_CHARGE" as const,
      title: `Charged twice: ${line.description}`,
      explanation:
        `This service appears ${eob ? "more often on the bill than on your EOB" : "twice on the bill"}` +
        `${line.serviceDate ? ` for ${line.serviceDate}` : ""}. The insurer processed it once, so the extra line ` +
        `likely shouldn't be on your bill. Amount is based on ${basis}.`,
      billLineIds: [original.id, line.id],
      eobLineIds: eob ? [eob.id] : [],
      amountAtStake: round2(amount),
      confidence,
      source: eob ? `EOB line ${eob.id} (processed once)` : "Rule: duplicate charge",
      params: {
        desc: line.description,
        date: line.serviceDate,
        onEob: !!eob,
        basis: basisKey,
        pct: context.coinsurancePct ?? null,
        eobLine: eob?.id ?? null,
      },
    });
  }
  return flags;
};
