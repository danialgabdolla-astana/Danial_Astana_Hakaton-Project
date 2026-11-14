import { describe, expect, it } from "vitest";
import { decodeCase, encodeCase, type CaseBundle } from "@/lib/case-link";
import { analysisIdFor } from "@/lib/hash";
import { runRules } from "@/lib/rules";
import { sampleBill, sampleEob } from "@/lib/sample-data";

function bundle(): CaseBundle {
  const { flags, summary, matches } = runRules(sampleBill, [sampleEob]);
  const analysisId = analysisIdFor({ bill: sampleBill, eobs: [sampleEob] });
  return {
    v: 1,
    analysis: { analysisId, createdAt: "2026-11-15T00:00:00.000Z", bill: sampleBill, eobs: [sampleEob], context: {}, matches, flags, summary },
    unlock: { token: "payload.signature", scope: analysisId },
    pack: {
      billingLetter: "Dear Billing Office, ".repeat(20),
      insurerLetter: null,
      phoneScript: { opening: "Hi", asks: ["Hold the account"], ifTheyPushBack: [], escalation: ["Supervisor"], writeDown: ["Name"] },
      deadlines: [{ title: "Call today", detail: "Ask for a hold", daysFromNow: 0 }],
    },
    dispute: {
      id: analysisId, provider: "Riverside General Hospital", billBalance: 1840, disputable: 645, status: "Letter sent",
      createdAt: "2026-11-15", letterSentAt: "2026-11-15", followUpDate: "2026-12-15", amountSaved: 0,
      calls: [{ id: "c1", date: "2026-11-16", who: "Maria", ref: "REF-1", notes: "Put on hold" }],
    },
  };
}

describe("private case link", () => {
  it("round-trips a full case", async () => {
    const b = bundle();
    const frag = await encodeCase(b);
    expect(frag).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeCase("#" + frag)).toEqual(b);
  });

  it("is short enough to bookmark or email", async () => {
    expect((await encodeCase(bundle())).length).toBeLessThan(6000);
  });

  it("rejects damaged links", async () => {
    const frag = await encodeCase(bundle());
    await expect(decodeCase(frag.slice(0, frag.length / 2))).rejects.toThrow(/damaged/);
    await expect(decodeCase("not a link!")).rejects.toThrow(/damaged/);
    await expect(decodeCase("")).rejects.toThrow(/damaged/);
  });

  it("rejects valid data that isn't a case", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, hello: "world" }));
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    const frag = Buffer.from(buf).toString("base64url");
    await expect(decodeCase(frag)).rejects.toThrow(/isn't a BillCheck case link/);
  });

  it("rejects an unlock scope that isn't an analysis id or family", async () => {
    const b = bundle();
    await expect(encodeCase({ ...b, unlock: { token: "x", scope: "admin" } })).rejects.toThrow();
  });
});
