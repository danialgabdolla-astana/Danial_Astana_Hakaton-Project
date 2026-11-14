import { baseCode, modifiers } from "../match";
import { round2 } from "../money";
import type { EobLine } from "../schemas";
import type { FlagDraft, Rule } from "./types";

/** LINE_NOT_ON_EOB: a charge your insurer never saw (or never processed). */
export const lineNotOnEob: Rule = ({ bill, eobs, matched, duplicateOf }) => {
  if (eobs.length === 0 || !bill.isItemized) return [];
  return bill.lines
    .filter((l) => !matched.has(l.id) && !duplicateOf.has(l.id) && l.billedAmount > 0)
    .map(
      (l): FlagDraft => ({
        ruleId: "LINE_NOT_ON_EOB",
        title: `Not on your EOB: ${l.description}`,
        explanation:
          "We couldn't find this charge on your insurer's EOB. It may never have been submitted to insurance, or it was billed separately. " +
          "Ask the provider to submit it to your insurer (or remove it) before you pay.",
        billLineIds: [l.id],
        eobLineIds: [],
        amountAtStake: round2(l.billedAmount),
        confidence: "medium",
        source: "Rule: no matching EOB line",
      }),
    );
};

const ER_CODES = /^9928[1-5]$/;

function isEmergency(l: EobLine) {
  const c = baseCode(l.code);
  return (c && ER_CODES.test(c)) || /emergency|\ber\b|e\.r\./i.test(l.description);
}

function ancillaryKind(l: EobLine): string | null {
  const c = baseCode(l.code);
  const n = c && /^\d{5}$/.test(c) ? parseInt(c, 10) : null;
  const mods = modifiers(l.code);
  if ((n !== null && n >= 100 && n <= 1999) || /anesth/i.test(l.description)) return "anesthesia";
  if (mods.some((m) => ["80", "81", "82", "AS"].includes(m)) || /assist(ant)? surg/i.test(l.description)) return "assistant surgeon";
  if ((n !== null && n >= 70010 && n <= 79999) || /radiolog|x-?ray|\bct\b|\bmri\b|ultrasound/i.test(l.description)) return "radiology";
  if ((n !== null && n >= 80047 && n <= 89398) || /patholog|\blab\b/i.test(l.description)) return "pathology/lab";
  return null;
}

/**
 * POSSIBLE_SURPRISE_BILL: out-of-network emergency care, or out-of-network ancillary services at an
 * in-network facility. The federal No Surprises Act may limit you to in-network cost-sharing.
 */
export const possibleSurpriseBill: Rule = ({ eobLines, context }) => {
  const anyInNetwork = eobLines.some((l) => l.networkStatus === "in");
  const flags: FlagDraft[] = [];
  for (const l of eobLines) {
    if (l.networkStatus !== "out") continue;
    const emergency = isEmergency(l);
    const kind = ancillaryKind(l);
    // Anesthesia and assistant surgeons almost always work inside a hospital or surgery center, so they're worth
    // flagging even when the facility's own claim isn't on this EOB. Radiology and labs can be freestanding.
    const facilityBased = kind === "anesthesia" || kind === "assistant surgeon";
    if (!emergency && !(kind && (anyInNetwork || facilityBased))) continue;

    let amount = l.patientResponsibility;
    let confidence: "medium" | "low" = "low";
    if (l.allowedAmount != null && context.coinsurancePct != null) {
      const inNetworkShare = l.allowedAmount * (context.coinsurancePct / 100);
      amount = Math.max(0, l.patientResponsibility - inNetworkShare);
      confidence = "medium";
    }
    const facilityKnown = emergency || anyInNetwork;
    const what = emergency ? "emergency care" : `${kind} at an in-network facility`;
    flags.push({
      ruleId: "POSSIBLE_SURPRISE_BILL",
      title: `Possible surprise bill: out-of-network ${emergency ? "emergency care" : kind}`,
      explanation:
        (facilityKnown
          ? `Your EOB marks this as out-of-network ${what}. Under the federal No Surprises Act, you may only owe what you'd pay in-network. `
          : `Your EOB marks this ${kind} as out-of-network. If it was given at an in-network hospital or surgery center, the federal ` +
            "No Surprises Act says you only owe in-network cost-sharing and the provider can't bill you the rest. ") +
        "Learn more at cms.gov/nosurprises." +
        (confidence === "low" ? " We don't know your in-network cost-sharing, so we show the full amount." : ""),
      billLineIds: [],
      eobLineIds: [l.id],
      amountAtStake: round2(amount),
      confidence,
      source: `EOB line ${l.id} (out-of-network)`,
    });
  }
  return flags;
};

/**
 * Pairs that are commonly billed together but are often included in one another.
 * [component, includedIn, note]. Framed as a question, never an accusation.
 */
const UNBUNDLING_PAIRS: { part: RegExp; whole: RegExp; note: string }[] = [
  { part: /^80048$/, whole: /^80053$/, note: "a basic metabolic panel is part of the comprehensive panel" },
  { part: /^(82947|84295|84132|82565|82310)$/, whole: /^(80048|80053)$/, note: "single tests that are already included in the metabolic panel" },
  { part: /^(85027|85004|85007|85014|85018)$/, whole: /^85025$/, note: "components of a complete blood count with differential" },
  { part: /^(93005|93010)$/, whole: /^93000$/, note: "parts of a complete ECG" },
  { part: /^99070$/, whole: /^(9928[1-5]|992[0-1]\d)$/, note: "supplies that are usually included in the visit or facility fee" },
  { part: /^9921[1-5]$/, whole: /^9928[1-5]$/, note: "a second office visit billed on the same day as an ER visit" },
];

export const possibleUnbundling: Rule = ({ bill }) => {
  const flags: FlagDraft[] = [];
  for (const part of bill.lines) {
    const pc = baseCode(part.code);
    if (!pc) continue;
    for (const pair of UNBUNDLING_PAIRS) {
      if (!pair.part.test(pc)) continue;
      const whole = bill.lines.find(
        (w) => w.id !== part.id && pair.whole.test(baseCode(w.code) ?? "") && (w.serviceDate === part.serviceDate || !w.serviceDate || !part.serviceDate),
      );
      if (!whole) continue;
      flags.push({
        ruleId: "POSSIBLE_UNBUNDLING",
        title: `Worth asking: ${part.description}`,
        explanation: `This was billed separately next to "${whole.description}". These are often billed as one service (${pair.note}). Ask the billing office whether it should be bundled.`,
        billLineIds: [part.id, whole.id],
        eobLineIds: [],
        amountAtStake: round2(part.billedAmount),
        confidence: "low",
        source: `Rule: commonly bundled codes ${pc} + ${baseCode(whole.code)}`,
      });
      break;
    }
  }
  return flags;
};
