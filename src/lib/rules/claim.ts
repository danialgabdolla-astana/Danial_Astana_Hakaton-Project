import { round2 } from "../money";
import type { Rule } from "./types";

/** Small differences (rounding, a few cents of interest) aren't worth a dispute. */
const MIN_GAP = 1;

/** BILL_EXCEEDS_EOB: the bill asks for more than the EOB says you owe. */
export const billExceedsEob: Rule = ({ bill, eobs, eobTotal, matches }) => {
  if (eobs.length === 0) return [];
  const anyMatch = matches.some((m) => m.eobLineId);
  if (!anyMatch && bill.isItemized && bill.lines.length > 0) return []; // probably a different claim
  const gap = round2(bill.patientBalance - eobTotal);
  if (gap < MIN_GAP) return [];
  return [
    {
      ruleId: "BILL_EXCEEDS_EOB",
      title: "Your bill is higher than what your EOB says you owe",
      explanation:
        `The bill asks for ${usd(bill.patientBalance)}, but your insurer's EOB lists your responsibility as ${usd(eobTotal)}. ` +
        `For an in-network claim, you generally shouldn't pay more than the EOB amount. Ask the billing office to explain or correct the difference.`,
      billLineIds: [],
      eobLineIds: eobs.flatMap((e) => e.lines.map((l) => l.id)),
      amountAtStake: gap,
      confidence: "high",
      source: "EOB total vs. bill balance",
    },
  ];
};

/** NO_INSURANCE_APPLIED: the bill shows no insurance payment or adjustment, but an EOB exists. */
export const noInsuranceApplied: Rule = ({ bill, eobs, eobLines, eobTotal }) => {
  if (eobs.length === 0) return [];
  const paid = bill.insurancePaid ?? 0;
  const adjusted = Math.abs(bill.adjustments ?? 0);
  if (paid !== 0 || adjusted !== 0) return [];
  const insurerActed = eobLines.some(
    (l) => (l.planPaid ?? 0) > 0 || (l.billedAmount != null && l.allowedAmount != null && l.billedAmount > l.allowedAmount),
  );
  const gap = round2(bill.patientBalance - eobTotal);
  if (!insurerActed || gap < MIN_GAP) return [];
  return [
    {
      ruleId: "NO_INSURANCE_APPLIED",
      title: "Insurance hasn't been applied to this bill",
      explanation:
        "The bill shows $0 paid or adjusted by insurance, but your EOB shows the claim was processed. The provider may have billed you before " +
        "posting the insurer's payment and discount. Ask them to apply the EOB and send a corrected bill.",
      billLineIds: [],
      eobLineIds: eobLines.map((l) => l.id),
      amountAtStake: gap,
      confidence: "high",
      source: "Bill: insurance paid/adjusted = $0",
    },
  ];
};

/** BALANCE_BILLING_IN_NETWORK: an in-network provider bills you for the contractual discount. */
export const balanceBillingInNetwork: Rule = ({ bill, matched, eobTotal }) => {
  if ((bill.insurancePaid ?? 0) === 0 && Math.abs(bill.adjustments ?? 0) === 0) return []; // covered by NO_INSURANCE_APPLIED
  const inNetwork = [...matched.values()].filter(
    (l) => l.networkStatus === "in" && l.billedAmount != null && l.allowedAmount != null && l.billedAmount > l.allowedAmount,
  );
  if (inNetwork.length === 0) return [];
  const discount = round2(inNetwork.reduce((s, l) => s + (l.billedAmount! - l.allowedAmount!), 0));
  const gap = round2(bill.patientBalance - eobTotal);
  if (gap < MIN_GAP || Math.abs(gap - discount) > Math.max(1, discount * 0.02)) return [];
  return [
    {
      ruleId: "BALANCE_BILLING_IN_NETWORK",
      title: "You're being billed for the in-network discount",
      explanation:
        `The extra ${usd(gap)} matches the "amount not allowed" on your EOB. In-network providers agree to accept the allowed amount, ` +
        "so this difference usually can't be billed to you.",
      billLineIds: [],
      eobLineIds: inNetwork.map((l) => l.id),
      amountAtStake: gap,
      confidence: "high",
      source: `EOB lines ${inNetwork.map((l) => l.id).join(", ")} (billed − allowed)`,
    },
  ];
};

/** NOT_ITEMIZED: a summary-only bill can't be checked line by line. */
export const notItemized: Rule = ({ bill }) => {
  if (bill.isItemized && bill.lines.length > 0) return [];
  return [
    {
      ruleId: "NOT_ITEMIZED",
      title: "This bill isn't itemized",
      explanation:
        "The bill only shows totals. You have the right to ask for an itemized bill with CPT/HCPCS codes for every service — " +
        "it's the only way to check it line by line. Ask for it before you pay.",
      billLineIds: [],
      eobLineIds: [],
      amountAtStake: 0,
      confidence: "high",
      source: "Rule: itemized bill required",
    },
  ];
};

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
