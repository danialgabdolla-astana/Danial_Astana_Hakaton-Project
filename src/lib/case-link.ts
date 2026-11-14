import { z } from "zod";
import { store } from "./client-store";
import { Analysis, StoredPack } from "./schemas";
import { getDisputes, saveDisputes } from "./tracker";

/**
 * A "private case link" replaces accounts. The whole case (analysis, unlock token, letter and tracker entry)
 * is compressed into the URL fragment: /open#<data>. Browsers never send the fragment to a server, so the
 * case still lives only with the user, now on any device they open the link on.
 */

const MAX_FRAGMENT = 60_000; // characters; real cases are ~3–6k
const MAX_JSON = 400_000; // bytes after decompression, guards against zip bombs

const CallLog = z.object({ id: z.string(), date: z.string(), who: z.string(), ref: z.string(), notes: z.string() });

export const DisputeEntry = z.object({
  id: z.string(),
  provider: z.string(),
  billBalance: z.number(),
  disputable: z.number(),
  status: z.enum(["Not started", "Letter sent", "Called", "Waiting", "Resolved"]),
  createdAt: z.string(),
  letterSentAt: z.string().nullable(),
  followUpDate: z.string(),
  amountSaved: z.number(),
  calls: z.array(CallLog),
});

export const CaseBundle = z.object({
  v: z.literal(1),
  analysis: Analysis,
  unlock: z
    .object({ token: z.string().max(1000), scope: z.string().regex(/^([a-f0-9]{24}|family)$/) })
    .nullable()
    .optional(),
  pack: StoredPack.nullable().optional(),
  dispute: DisputeEntry.nullable().optional(),
});
export type CaseBundle = z.infer<typeof CaseBundle>;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit = Infinity): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/** Why a link couldn't be opened; the UI shows `code` in the user's language. */
export class CaseLinkError extends Error {
  constructor(
    message: string,
    public code: "damaged" | "notCase",
  ) {
    super(message);
  }
}

/** Bundle → URL-safe fragment (deflate + base64url). */
export async function encodeCase(bundle: CaseBundle): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(CaseBundle.parse(bundle)));
  return toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

/** Fragment → validated bundle. Throws a friendly error if the link is damaged or not ours. */
export async function decodeCase(fragment: string): Promise<CaseBundle> {
  const data = fragment.replace(/^#/, "").trim();
  if (!data || data.length > MAX_FRAGMENT || !/^[A-Za-z0-9_-]+$/.test(data)) throw new CaseLinkError("This link is incomplete or damaged.", "damaged");
  let parsed: unknown;
  try {
    const bytes = await pipe(fromBase64Url(data), new DecompressionStream("deflate-raw"), MAX_JSON);
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new CaseLinkError("This link is incomplete or damaged. Try copying it again.", "damaged");
  }
  const result = CaseBundle.safeParse(parsed);
  if (!result.success) throw new CaseLinkError("This link isn't a BillCheck case link.", "notCase");
  return result.data;
}

/** Gathers everything this browser knows about one case. Client-only (reads localStorage). */
export async function caseLinkFor(analysis: z.infer<typeof Analysis>): Promise<string> {
  const pack = StoredPack.safeParse(store.getPack(analysis.analysisId));
  const dispute = DisputeEntry.safeParse(getDisputes().find((d) => d.id === analysis.analysisId));
  const fragment = await encodeCase({
    v: 1,
    analysis,
    unlock: store.getUnlockWithScope(analysis.analysisId),
    pack: pack.success ? pack.data : null,
    dispute: dispute.success ? dispute.data : null,
  });
  return `${window.location.origin}/open#${fragment}`;
}

/** Saves a decoded case into this browser. An existing tracker entry for the same bill is kept as is. */
export async function importCase(b: CaseBundle): Promise<string> {
  const id = b.analysis.analysisId;
  store.saveAnalysis(b.analysis);
  if (b.unlock && !store.getUnlock(id)) store.saveUnlock(b.unlock.token, b.unlock.scope);
  if (b.pack && !store.getPack(id)) store.savePack(id, b.pack);
  const list = getDisputes();
  if (b.dispute && !list.some((d) => d.id === id)) saveDisputes([b.dispute, ...list]);
  return id;
}
