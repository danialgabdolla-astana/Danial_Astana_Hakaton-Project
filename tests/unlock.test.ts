import { beforeAll, describe, expect, it } from "vitest";
import { signUnlock, verifyUnlock } from "@/lib/unlock";
import { analysisIdFor } from "@/lib/hash";
import { maskRef, scrub } from "@/lib/redact";
import { sampleBill, sampleEob } from "@/lib/sample-data";

beforeAll(() => {
  process.env.UNLOCK_SECRET = "test-secret-that-is-long-enough";
});

describe("unlock tokens", () => {
  it("accepts a token for the same bill", () => {
    const t = signUnlock("abc123", "single", 30);
    expect(verifyUnlock(t, "abc123")?.plan).toBe("single");
  });

  it("rejects a token for a different bill", () => {
    expect(verifyUnlock(signUnlock("abc123", "single", 30), "other")).toBeNull();
  });

  it("family tokens unlock any bill", () => {
    expect(verifyUnlock(signUnlock("family", "family", 365), "anything")?.plan).toBe("family");
  });

  it("rejects tampered and expired tokens", () => {
    const t = signUnlock("abc123", "single", 30);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), scope: "family" })).toString("base64url");
    expect(verifyUnlock(`${forged}.${sig}`, "x")).toBeNull();
    const old = signUnlock("abc123", "single", 1, Date.now() - 3 * 86_400_000);
    expect(verifyUnlock(old, "abc123")).toBeNull();
    expect(verifyUnlock("garbage", "abc123")).toBeNull();
  });
});

describe("analysis id", () => {
  it("is stable and changes when the documents change", () => {
    const a = analysisIdFor({ bill: sampleBill, eobs: [sampleEob] });
    expect(analysisIdFor({ bill: { ...sampleBill }, eobs: [sampleEob] })).toBe(a);
    expect(analysisIdFor({ bill: { ...sampleBill, patientBalance: 1 }, eobs: [sampleEob] })).not.toBe(a);
  });
});

describe("redaction", () => {
  it("masks references to the last 4 characters", () => {
    expect(maskRef("000-58-4471")).toBe("****4471");
    expect(maskRef("XQH 88124093")).toBe("****4093");
  });

  it("scrubs SSNs, phone numbers, long IDs and street addresses", () => {
    const s = scrub("SSN 123-45-6789 call (614) 555-0142 member 88124093 at 48 Maple Grove Ln");
    expect(s).not.toMatch(/6789|555-0142|88124093|Maple Grove/);
  });
});
