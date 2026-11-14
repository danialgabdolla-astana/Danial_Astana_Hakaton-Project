import { createHash } from "node:crypto";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object)
        .sort()
        .map((k) => [k, stable((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/**
 * The analysis id is a hash of the extracted documents, so an unlock token for one bill can't be used
 * to generate letters for a different (or edited) bill. Server-only.
 */
export function analysisIdFor(data: { bill: unknown; eobs: unknown }): string {
  return createHash("sha256").update(JSON.stringify(stable({ bill: data.bill, eobs: data.eobs }))).digest("hex").slice(0, 24);
}
