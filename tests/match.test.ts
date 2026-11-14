import { describe, expect, it } from "vitest";
import { baseCode, matchLines, similarity } from "@/lib/match";
import { toUsd } from "@/lib/money";
import type { BillLine, EobLine } from "@/lib/schemas";

const bl = (id: string, p: Partial<BillLine>): BillLine => ({
  id, serviceDate: "2026-01-10", code: null, codeType: null, description: "", quantity: 1, billedAmount: 0, ...p,
});
const el = (id: string, p: Partial<EobLine>): EobLine => ({
  id, serviceDate: "2026-01-10", code: null, description: "", billedAmount: null, allowedAmount: null, planPaid: null, deductible: null,
  copay: null, coinsurance: null, notCovered: null, patientResponsibility: 0, remarkCodes: [], networkStatus: "unknown", ...p,
});

describe("baseCode", () => {
  it("strips modifiers", () => {
    expect(baseCode("70450-26")).toBe("70450");
    expect(baseCode(" 99284 25")).toBe("99284");
    expect(baseCode(null)).toBeNull();
  });
});

describe("toUsd", () => {
  it("normalizes money strings", () => {
    expect(toUsd("$1,240.00")).toBe(1240);
    expect(toUsd("(45.10)")).toBe(-45.1);
    expect(toUsd("-$3")).toBe(-3);
    expect(toUsd("n/a")).toBeNull();
    expect(toUsd(12.345)).toBe(12.35);
  });
});

describe("matchLines", () => {
  it("matches by date + code and leaves the second copy unmatched", () => {
    const m = matchLines(
      [bl("B1", { code: "70450", description: "CT head" }), bl("B2", { code: "70450", description: "CT head" })],
      [el("E1", { code: "70450-TC", description: "CT scan head" })],
    );
    expect(m).toEqual([
      { billLineId: "B1", eobLineId: "E1" },
      { billLineId: "B2", eobLineId: null },
    ]);
  });

  it("does not match the same code on a different date", () => {
    const m = matchLines([bl("B1", { code: "99213", serviceDate: "2026-01-11" })], [el("E1", { code: "99213" })]);
    expect(m[0].eobLineId).toBeNull();
  });

  it("falls back to description + amount when codes are missing", () => {
    const m = matchLines(
      [bl("B1", { description: "Emergency room visit level 4", billedAmount: 1450 })],
      [el("E1", { description: "Emergency room visit - level 4", billedAmount: 1450 })],
    );
    expect(m[0].eobLineId).toBe("E1");
  });

  it("does not pair lines whose codes differ", () => {
    const m = matchLines([bl("B1", { code: "99070", description: "Supplies" })], [el("E1", { code: "99284", description: "Supplies" })]);
    expect(m[0].eobLineId).toBeNull();
  });

  it("similarity ignores punctuation and stop words", () => {
    expect(similarity("CT head/brain w/o contrast", "CT head brain without contrast")).toBeGreaterThan(0.7);
  });
});
