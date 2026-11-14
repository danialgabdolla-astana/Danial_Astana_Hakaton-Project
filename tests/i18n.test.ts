import { describe, expect, it } from "vitest";
import { apiErrorText, deadlineText, flagText, LOCALES, MESSAGES } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { deadlinesFor } from "@/lib/dispute";
import { runRules } from "@/lib/rules";
import { sampleBill, sampleEob, surpriseBill, surpriseEob } from "@/lib/sample-data";
import type { BillDoc, EobDoc, EobLine, Flag } from "@/lib/schemas";

function eobLine(p: Partial<EobLine> & { id: string; patientResponsibility: number }): EobLine {
  return {
    serviceDate: "2026-01-10", code: null, description: "Service", billedAmount: null, allowedAmount: null, planPaid: null,
    deductible: null, copay: null, coinsurance: null, notCovered: null, remarkCodes: [], networkStatus: "in", ...p,
  };
}
const bill = (p: Partial<BillDoc>): BillDoc => ({
  providerName: "Test Clinic", accountRef: "****0000", statementDate: null, dueDate: null, isItemized: true, lines: [],
  totalCharges: null, insurancePaid: null, adjustments: null, patientBalance: 0, ...p,
});
const eob = (lines: EobLine[]): EobDoc => ({
  insurerName: "Test Plan", claimRef: "****1111", providerName: null, lines,
  totalPatientResponsibility: lines.reduce((s, l) => s + l.patientResponsibility, 0),
});
const visit = { id: "B1", serviceDate: "2026-01-10", code: "99213", codeType: "CPT" as const, description: "Office visit", quantity: 1, billedAmount: 250 };

/** Cases that together raise every one of the 8 rules, including each branch of the text. */
function allFlags(): Flag[] {
  return [
    ...runRules(sampleBill, [sampleEob]).flags, // duplicate, line not on EOB, bill > EOB, unbundling
    ...runRules(surpriseBill, [surpriseEob]).flags, // out-of-network bill > EOB, surprise bill (facility unknown)
    ...runRules(surpriseBill, [surpriseEob], { coinsurancePct: 20 }).flags, // surprise bill, estimated
    ...runRules(bill({ lines: [visit], insurancePaid: 0, adjustments: 0, patientBalance: 250 }), [
      eob([eobLine({ id: "E1", code: "99213", billedAmount: 250, allowedAmount: 110, planPaid: 80, patientResponsibility: 30 })]),
    ]).flags, // no insurance applied
    ...runRules(bill({ lines: [visit], insurancePaid: 80, adjustments: 0, patientBalance: 170 }), [
      eob([eobLine({ id: "E1", code: "99213", billedAmount: 250, allowedAmount: 110, planPaid: 80, patientResponsibility: 30 })]),
    ]).flags, // balance billing
    ...runRules(bill({ isItemized: false, patientBalance: 900 }), [
      eob([eobLine({ id: "E1", code: "99284", description: "ER visit", networkStatus: "out", patientResponsibility: 900 })]),
    ]).flags, // not itemized, surprise bill (emergency)
    ...runRules(
      bill({
        lines: [
          { ...visit, code: "85025", description: "CBC" },
          { ...visit, id: "B2", code: "85025", description: "CBC" },
        ],
        patientBalance: 40,
      }),
      [eob([eobLine({ id: "E1", code: "85025", billedAmount: 250, allowedAmount: 60, deductible: 0, patientResponsibility: 12 })])],
      { coinsurancePct: 20 },
    ).flags, // duplicate via coinsurance
  ];
}

describe("translations", () => {
  const flags = allFlags();

  it("covers all 8 rules in the test cases", () => {
    expect(new Set(flags.map((f) => f.ruleId)).size).toBe(8);
  });

  it("the English templates reproduce the server's flag text exactly", () => {
    for (const f of flags) {
      const r = en.rules[f.ruleId] as { title: (p: object) => string; explanation: (p: object) => string; source: (p: object) => string };
      expect(r.title(f.params!), f.ruleId).toBe(f.title);
      expect(r.explanation(f.params!), f.ruleId).toBe(f.explanation);
      expect(r.source(f.params!), f.ruleId).toBe(f.source);
    }
  });

  it("every flag reads cleanly in Spanish and French", () => {
    for (const locale of ["es", "fr"] as const) {
      for (const f of flags) {
        const t = flagText(f, MESSAGES[locale]);
        const all = `${t.title} ${t.explanation} ${t.source}`;
        expect(all, `${locale} ${f.ruleId}`).not.toMatch(/undefined|null|NaN|\$\{/);
        expect(t.explanation).not.toBe(f.explanation);
      }
    }
  });

  it("old saved flags without params fall back to the English text", () => {
    const f = { ...flags[0], params: undefined };
    expect(flagText(f, MESSAGES.es).title).toBe(f.title);
  });

  it("translates every deadline", () => {
    const ds = deadlinesFor(flags, { ...sampleBill, dueDate: "2026-11-26" });
    expect(ds.every((d) => d.key)).toBe(true);
    for (const locale of LOCALES) {
      for (const d of ds) {
        const t = deadlineText(d, MESSAGES[locale]);
        expect(t.title.length).toBeGreaterThan(5);
        if (locale === "en") expect(t).toEqual({ title: d.title, detail: d.detail });
      }
    }
    expect(deadlineText(ds.find((d) => d.key === "dueDate")!, MESSAGES.fr).title).toContain("2026-11-26");
  });

  it("translates API errors by code and keeps the server message otherwise", () => {
    expect(apiErrorText({ error: "Please add…", code: "missingBill" }, MESSAGES.es, "x")).toMatch(/factura/);
    expect(apiErrorText({ error: "x", code: "rateLimited", vars: { minutes: 7 } }, MESSAGES.fr, "x")).toContain("7 minutes");
    expect(apiErrorText({ error: "Missing STRIPE_SECRET_KEY", code: "notConfigured" }, MESSAGES.es, "x")).toBe("Missing STRIPE_SECRET_KEY");
    expect(apiErrorText({ error: "Server said", code: "unknown-code" }, MESSAGES.fr, "x")).toBe("Server said");
    expect(apiErrorText(null, MESSAGES.fr, "fallback")).toBe("fallback");
  });

  it("every language has the same set of messages as English", () => {
    const shape = (o: unknown): unknown =>
      Array.isArray(o) ? o.map(shape) : o && typeof o === "object" ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, shape((o as Record<string, unknown>)[k])])) : typeof o;
    const base = { ...en, pack: { ...en.pack, fieldNames: {} } };
    for (const locale of ["es", "fr"] as const) {
      const m = MESSAGES[locale];
      expect(shape({ ...m, pack: { ...m.pack, fieldNames: {} } })).toEqual(shape(base));
    }
  });
});
