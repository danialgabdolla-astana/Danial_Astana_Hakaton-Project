import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isSampleCase, sampleAnalysis } from "@/lib/samples";
import { sampleBill, sampleEob } from "@/lib/sample-data";
import { Analysis } from "@/lib/schemas";

const read = (kind: string) => JSON.parse(readFileSync(`public/samples/${kind}.analysis.json`, "utf8"));

describe("precomputed sample results", () => {
  for (const kind of ["er", "anesthesia"] as const) {
    it(`${kind}: the file the demo loads equals a fresh run of the rules engine`, () => {
      const file = read(kind);
      expect(Analysis.parse(file)).toEqual(sampleAnalysis(kind));
    });
  }

  it("shows $645 and $2,200, like the live pipeline", () => {
    expect(read("er").summary.disputableTotal).toBe(645);
    expect(read("anesthesia").summary.disputableTotal).toBe(2200);
  });

  it("only the exact demo documents are free", () => {
    expect(isSampleCase(sampleBill, [sampleEob])).toBe(true);
    expect(isSampleCase({ ...sampleBill, patientBalance: 1841 }, [sampleEob])).toBe(false);
  });
});

describe("saved sample dispute packs", () => {
  for (const kind of ["er", "anesthesia"] as const) {
    it(`${kind}: is a valid pack with US dates and the account-hold ask`, async () => {
      const { StoredPack } = await import("@/lib/schemas");
      const pack = StoredPack.parse(JSON.parse(readFileSync(`public/samples/${kind}.pack.json`, "utf8")));
      expect(pack.billingLetter).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(pack.phoneScript.asks.some((a) => /on hold/i.test(a))).toBe(true);
    });
  }
});
