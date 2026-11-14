import { describe, expect, it } from "vitest";
import { runRules, disputableTotal } from "@/lib/rules";
import { sampleBill, sampleEob } from "@/lib/sample-data";
import type { BillDoc, EobDoc, EobLine, Flag } from "@/lib/schemas";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const byRule = (flags: Flag[], ruleId: Flag["ruleId"]) => flags.filter((f) => f.ruleId === ruleId);

function eobLine(p: Partial<EobLine> & { id: string; patientResponsibility: number }): EobLine {
  return {
    serviceDate: "2026-01-10", code: null, description: "Service", billedAmount: null, allowedAmount: null, planPaid: null,
    deductible: null, copay: null, coinsurance: null, notCovered: null, remarkCodes: [], networkStatus: "in", ...p,
  };
}

function bill(p: Partial<BillDoc>): BillDoc {
  return {
    providerName: "Test Clinic", accountRef: "****0000", statementDate: null, dueDate: null, isItemized: true, lines: [],
    totalCharges: null, insurancePaid: null, adjustments: null, patientBalance: 0, ...p,
  };
}

function eob(lines: EobLine[], total?: number): EobDoc {
  return {
    insurerName: "Test Plan", claimRef: "****1111", providerName: null, lines,
    totalPatientResponsibility: total ?? lines.reduce((s, l) => s + l.patientResponsibility, 0),
  };
}

describe("sample case (Riverside General ER visit)", () => {
  const { flags, summary } = runRules(sampleBill, [sampleEob]);

  it("finds the duplicate CT scan at the allowed amount", () => {
    const d = byRule(flags, "DUPLICATE_CHARGE");
    expect(d).toHaveLength(1);
    expect(d[0].amountAtStake).toBe(480);
    expect(d[0].confidence).toBe("high");
    expect(d[0].billLineIds).toEqual(["B2", "B3"]);
    expect(d[0].eobLineIds).toEqual(["E2"]);
  });

  it("finds the supply line that is not on the EOB", () => {
    const n = byRule(flags, "LINE_NOT_ON_EOB");
    expect(n).toHaveLength(1);
    expect(n[0].amountAtStake).toBe(165);
    expect(n[0].confidence).toBe("medium");
    expect(n[0].billLineIds).toEqual(["B5"]);
  });

  it("flags the $645 gap between bill and EOB", () => {
    const e = byRule(flags, "BILL_EXCEEDS_EOB");
    expect(e).toHaveLength(1);
    expect(e[0].amountAtStake).toBe(645);
    expect(e[0].confidence).toBe("high");
  });

  it("counts every dollar once: disputable total is $645, not $1,290", () => {
    expect(summary.disputableTotal).toBe(645);
    expect(summary.billBalance).toBe(1840);
    expect(summary.eobPatientResponsibility).toBe(1195);
  });

  it("raises no false alarms on the sample", () => {
    for (const r of ["NO_INSURANCE_APPLIED", "BALANCE_BILLING_IN_NETWORK", "POSSIBLE_SURPRISE_BILL", "NOT_ITEMIZED"] as const) {
      expect(byRule(flags, r)).toHaveLength(0);
    }
  });
});

describe("DUPLICATE_CHARGE", () => {
  it("falls back to coinsurance when the deductible is met", () => {
    const b = bill({
      lines: [
        { id: "B1", serviceDate: "2026-01-10", code: "85025", codeType: "CPT", description: "CBC", quantity: 1, billedAmount: 100 },
        { id: "B2", serviceDate: "2026-01-10", code: "85025", codeType: "CPT", description: "CBC", quantity: 1, billedAmount: 100 },
      ],
      patientBalance: 40,
    });
    const e = eob([eobLine({ id: "E1", code: "85025", billedAmount: 100, allowedAmount: 60, deductible: 0, patientResponsibility: 12 })]);
    const d = byRule(runRules(b, [e], { coinsurancePct: 20 }).flags, "DUPLICATE_CHARGE");
    expect(d).toHaveLength(1);
    expect(d[0].amountAtStake).toBe(12);
  });

  it("uses the billed amount with low confidence when there is no EOB match", () => {
    const b = bill({
      lines: [
        { id: "B1", serviceDate: "2026-01-10", code: null, codeType: null, description: "Saline IV bag", quantity: 1, billedAmount: 55 },
        { id: "B2", serviceDate: "2026-01-10", code: null, codeType: null, description: "Saline IV bag", quantity: 1, billedAmount: 55 },
      ],
      patientBalance: 110,
    });
    const d = byRule(runRules(b, []).flags, "DUPLICATE_CHARGE");
    expect(d).toHaveLength(1);
    expect(d[0].confidence).toBe("low");
    expect(d[0].amountAtStake).toBe(55);
  });
});

describe("BILL_EXCEEDS_EOB", () => {
  it("does not fire when the bill matches the EOB", () => {
    const b = clone(sampleBill);
    b.lines = b.lines.filter((l) => l.id !== "B3" && l.id !== "B5");
    b.patientBalance = 1195;
    expect(byRule(runRules(b, [sampleEob]).flags, "BILL_EXCEEDS_EOB")).toHaveLength(0);
  });

  it("ignores differences under $1", () => {
    const b = clone(sampleBill);
    b.lines = b.lines.filter((l) => l.id !== "B3" && l.id !== "B5");
    b.patientBalance = 1195.5;
    expect(byRule(runRules(b, [sampleEob]).flags, "BILL_EXCEEDS_EOB")).toHaveLength(0);
  });
});

describe("NO_INSURANCE_APPLIED", () => {
  it("fires when the bill shows no insurance activity but the EOB does", () => {
    const b = bill({
      lines: [{ id: "B1", serviceDate: "2026-01-10", code: "99213", codeType: "CPT", description: "Office visit", quantity: 1, billedAmount: 250 }],
      insurancePaid: 0,
      adjustments: 0,
      patientBalance: 250,
    });
    const e = eob([eobLine({ id: "E1", code: "99213", billedAmount: 250, allowedAmount: 110, planPaid: 80, patientResponsibility: 30 })]);
    const { flags, summary } = runRules(b, [e]);
    const n = byRule(flags, "NO_INSURANCE_APPLIED");
    expect(n).toHaveLength(1);
    expect(n[0].amountAtStake).toBe(220);
    expect(byRule(flags, "BALANCE_BILLING_IN_NETWORK")).toHaveLength(0);
    // Same gap also triggers BILL_EXCEEDS_EOB; it must not be counted twice.
    expect(summary.disputableTotal).toBe(220);
  });
});

describe("BALANCE_BILLING_IN_NETWORK", () => {
  it("fires when the extra amount equals the contractual discount", () => {
    const b = bill({
      lines: [{ id: "B1", serviceDate: "2026-01-10", code: "99213", codeType: "CPT", description: "Office visit", quantity: 1, billedAmount: 250 }],
      insurancePaid: 80,
      adjustments: 0,
      patientBalance: 170,
    });
    const e = eob([eobLine({ id: "E1", code: "99213", billedAmount: 250, allowedAmount: 110, planPaid: 80, patientResponsibility: 30 })]);
    const f = byRule(runRules(b, [e]).flags, "BALANCE_BILLING_IN_NETWORK");
    expect(f).toHaveLength(1);
    expect(f[0].amountAtStake).toBe(140);
    expect(f[0].confidence).toBe("high");
  });

  it("does not fire for out-of-network lines", () => {
    const b = bill({
      lines: [{ id: "B1", serviceDate: "2026-01-10", code: "99213", codeType: "CPT", description: "Office visit", quantity: 1, billedAmount: 250 }],
      insurancePaid: 80,
      adjustments: 0,
      patientBalance: 170,
    });
    const e = eob([eobLine({ id: "E1", code: "99213", billedAmount: 250, allowedAmount: 110, planPaid: 80, patientResponsibility: 30, networkStatus: "out" })]);
    expect(byRule(runRules(b, [e]).flags, "BALANCE_BILLING_IN_NETWORK")).toHaveLength(0);
  });
});

describe("LINE_NOT_ON_EOB", () => {
  it("skips credits and payments", () => {
    const b = bill({
      lines: [
        { id: "B1", serviceDate: "2026-01-10", code: "99213", codeType: "CPT", description: "Office visit", quantity: 1, billedAmount: 250 },
        { id: "B2", serviceDate: "2026-01-12", code: null, codeType: null, description: "Patient payment - thank you", quantity: null, billedAmount: -50 },
      ],
      patientBalance: 30,
    });
    const e = eob([eobLine({ id: "E1", code: "99213", billedAmount: 250, allowedAmount: 110, planPaid: 80, patientResponsibility: 30 })]);
    expect(byRule(runRules(b, [e]).flags, "LINE_NOT_ON_EOB")).toHaveLength(0);
  });
});

describe("POSSIBLE_SURPRISE_BILL", () => {
  const base = bill({
    lines: [
      { id: "B1", serviceDate: "2026-03-02", code: "47562", codeType: "CPT", description: "Laparoscopic cholecystectomy", quantity: 1, billedAmount: 9000 },
    ],
    patientBalance: 2600,
  });

  it("flags out-of-network anesthesia at an in-network facility (low without coinsurance)", () => {
    const e = eob([
      eobLine({ id: "E1", serviceDate: "2026-03-02", code: "47562", description: "Lap chole", patientResponsibility: 600, networkStatus: "in" }),
      eobLine({ id: "E2", serviceDate: "2026-03-02", code: "00790", description: "Anesthesia, upper abdomen", allowedAmount: 900, patientResponsibility: 2000, networkStatus: "out" }),
    ]);
    const f = byRule(runRules(base, [e]).flags, "POSSIBLE_SURPRISE_BILL");
    expect(f).toHaveLength(1);
    expect(f[0].confidence).toBe("low");
    expect(f[0].amountAtStake).toBe(2000);
    expect(f[0].explanation).toContain("No Surprises Act");
  });

  it("estimates the overcharge when coinsurance is known", () => {
    const e = eob([
      eobLine({ id: "E1", serviceDate: "2026-03-02", code: "47562", description: "Lap chole", patientResponsibility: 600, networkStatus: "in" }),
      eobLine({ id: "E2", serviceDate: "2026-03-02", code: "00790", description: "Anesthesia", allowedAmount: 900, patientResponsibility: 2000, networkStatus: "out" }),
    ]);
    const f = byRule(runRules(base, [e], { coinsurancePct: 20 }).flags, "POSSIBLE_SURPRISE_BILL");
    expect(f[0].confidence).toBe("medium");
    expect(f[0].amountAtStake).toBe(1820);
  });

  it("flags out-of-network emergency care even without an in-network facility", () => {
    const e = eob([eobLine({ id: "E1", code: "99285", description: "ER visit level 5", patientResponsibility: 1500, networkStatus: "out" })]);
    expect(byRule(runRules(bill({ patientBalance: 1500, isItemized: false }), [e]).flags, "POSSIBLE_SURPRISE_BILL")).toHaveLength(1);
  });

  it("does not flag an out-of-network office visit", () => {
    const e = eob([eobLine({ id: "E1", code: "99213", description: "Office visit", patientResponsibility: 200, networkStatus: "out" })]);
    expect(byRule(runRules(bill({ patientBalance: 200 }), [e]).flags, "POSSIBLE_SURPRISE_BILL")).toHaveLength(0);
  });
});

describe("NOT_ITEMIZED", () => {
  it("asks for an itemized bill when there are no lines", () => {
    const f = byRule(runRules(bill({ isItemized: false, patientBalance: 900 }), []).flags, "NOT_ITEMIZED");
    expect(f).toHaveLength(1);
    expect(f[0].amountAtStake).toBe(0);
    expect(f[0].confidence).toBe("high");
  });
});

describe("POSSIBLE_UNBUNDLING", () => {
  it("asks about a basic panel billed with a comprehensive panel, at low confidence", () => {
    const b = bill({
      lines: [
        { id: "B1", serviceDate: "2026-01-10", code: "80053", codeType: "CPT", description: "Comprehensive metabolic panel", quantity: 1, billedAmount: 120 },
        { id: "B2", serviceDate: "2026-01-10", code: "80048", codeType: "CPT", description: "Basic metabolic panel", quantity: 1, billedAmount: 90 },
      ],
      patientBalance: 210,
    });
    const { flags, summary } = runRules(b, []);
    const f = byRule(flags, "POSSIBLE_UNBUNDLING");
    expect(f).toHaveLength(1);
    expect(f[0].confidence).toBe("low");
    expect(summary.disputableTotal).toBe(0); // low-confidence flags never count
  });
});

describe("disputableTotal", () => {
  it("adds independent line-level flags when there is no claim-level flag", () => {
    const flags = [
      { ruleId: "DUPLICATE_CHARGE", amountAtStake: 100, confidence: "high" },
      { ruleId: "LINE_NOT_ON_EOB", amountAtStake: 50, confidence: "medium" },
      { ruleId: "POSSIBLE_UNBUNDLING", amountAtStake: 999, confidence: "low" },
    ] as Flag[];
    expect(disputableTotal(flags)).toBe(150);
  });
});
