import { describe, expect, it } from "vitest";
import { fillPlaceholders, findPlaceholders, letterDate } from "@/lib/placeholders";

describe("letter placeholders", () => {
  const letter = "[Date]\n\nDear Billing Office,\nAccount number: [Account number]\n\nSincerely,\n[Your name]\n[Phone] | [Email]\n[Your name]";

  it("finds unique placeholders in order", () => {
    expect(findPlaceholders(letter)).toEqual(["Date", "Account number", "Your name", "Phone", "Email"]);
  });

  it("finds placeholders across several texts", () => {
    expect(findPlaceholders("[Your name]", "call [Phone]", "[Your name]")).toEqual(["Your name", "Phone"]);
  });

  it("fills known values and keeps unfilled brackets", () => {
    const out = fillPlaceholders(letter, { "Your name": "Jane Doe", Phone: "  ", Date: "November 15, 2026" });
    expect(out).toContain("Jane Doe\n[Phone] | [Email]\nJane Doe");
    expect(out.startsWith("November 15, 2026")).toBe(true);
    expect(out).toContain("[Account number]");
  });

  it("ignores things that are not placeholders", () => {
    expect(findPlaceholders("see [1] and [] and [x".concat("]"))).toEqual(["x"]);
    expect(findPlaceholders("total: $645 [")).toEqual([]);
  });

  it("formats a US letter date", () => {
    expect(letterDate(new Date(2026, 10, 15))).toBe("Nov 15, 2026");
  });
});
