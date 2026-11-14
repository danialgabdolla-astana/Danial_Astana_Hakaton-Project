import { describe, expect, it } from "vitest";
import { EmailRequest, composeEmail } from "@/lib/email";

const base = {
  to: "pat@example.com",
  provider: "Mercy General <b>Hospital</b>",
  billBalance: 2850,
  disputable: 645,
  caseUrl: "https://mybillcheck.vercel.app/open#abc_DEF-123",
};

describe("case emails", () => {
  it("validates the request", () => {
    expect(EmailRequest.safeParse({ ...base, kind: "case" }).success).toBe(true);
    expect(EmailRequest.safeParse({ ...base, kind: "case", to: "not-an-email" }).success).toBe(false);
    expect(EmailRequest.safeParse({ ...base, kind: "spam" }).success).toBe(false);
  });

  it("includes the amounts and the private link, and escapes the provider name in HTML", () => {
    const m = composeEmail(EmailRequest.parse({ ...base, kind: "case" }));
    expect(m.subject).toContain("$645.00");
    expect(m.text).toContain(base.caseUrl);
    expect(m.text).toContain("$2,850.00");
    expect(m.html).toContain("&lt;b&gt;Hospital&lt;/b&gt;");
    expect(m.html).not.toContain("<b>Hospital</b>");
    expect(m.ics).toBeNull();
  });

  it("adds the follow-up date and a calendar file after the letter is sent", () => {
    const m = composeEmail(EmailRequest.parse({ ...base, kind: "letterSent", status: "Letter sent", followUpDate: "2026-12-15" }));
    expect(m.text).toContain("Dec 15, 2026");
    expect(m.ics).toContain("DTSTART;VALUE=DATE:20261215");
  });

  it("is translated", () => {
    const es = composeEmail(EmailRequest.parse({ ...base, kind: "status", status: "Waiting", locale: "es" }));
    expect(es.text).toContain("Estado: En espera");
    const fr = composeEmail(EmailRequest.parse({ ...base, kind: "status", status: "Resolved", locale: "fr" }));
    expect(fr.text).toContain("Statut : Résolue");
    expect(fr.ics).toBeNull();
  });
});

describe("subjects", () => {
  it("differ by kind", () => {
    const s = (kind: "case" | "letterSent" | "status") => composeEmail(EmailRequest.parse({ ...base, kind, status: "Called" })).subject;
    expect(new Set([s("case"), s("letterSent"), s("status")]).size).toBe(3);
    expect(s("status")).toContain("Called");
  });
});
