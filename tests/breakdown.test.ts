import { describe, expect, it } from "vitest";
import { breakdownOf } from "@/lib/breakdown";
import { runRules } from "@/lib/rules";
import { sampleBill, sampleEob, surpriseBill, surpriseEob } from "@/lib/sample-data";

describe("disputable total breakdown", () => {
  it("ER sample: $480 duplicate + $165 not on EOB = $645; the totals gap and the bundling question are already inside it", () => {
    const { flags } = runRules(sampleBill, [sampleEob]);
    const bd = breakdownOf(flags);
    expect(bd.mode).toBe("lines");
    expect(bd.counted.map((f) => [f.ruleId, f.amountAtStake])).toEqual([
      ["DUPLICATE_CHARGE", 480],
      ["LINE_NOT_ON_EOB", 165],
    ]);
    expect(bd.counted.reduce((s, f) => s + f.amountAtStake, 0)).toBe(bd.total);
    const by = (r: string) => bd.status[flags.find((f) => f.ruleId === r)!.id];
    expect(by("BILL_EXCEEDS_EOB")).toBe("included");
    expect(by("POSSIBLE_UNBUNDLING")).toBe("included");
  });

  it("anesthesia sample: the $2,200 gap is the total; the surprise-bill question is not added", () => {
    const { flags } = runRules(surpriseBill, [surpriseEob]);
    const bd = breakdownOf(flags);
    expect(bd.mode).toBe("claim");
    expect(bd.counted[0].amountAtStake).toBe(2200);
    expect(bd.status[flags.find((f) => f.ruleId === "POSSIBLE_SURPRISE_BILL")!.id]).toBe("notAdded");
  });

  it("no counted issues: no breakdown", () => {
    expect(breakdownOf([]).mode).toBe("none");
  });
});
