import { extractBill, extractEobs, UserError, type DocInput } from "@/lib/anthropic";
import { analysisIdFor } from "@/lib/hash";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { redactAndNumber } from "@/lib/redact";
import { runRules } from "@/lib/rules";
import { PlanContext, type Analysis } from "@/lib/schemas";

export const maxDuration = 120;

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILES_PER_DOC = 3;
const MAX_TOTAL_BYTES = 4_200_000; // Vercel rejects request bodies over ~4.5 MB
const MAX_TEXT = 30_000;

async function readDocs(form: FormData, field: "bill" | "eob"): Promise<{ docs: DocInput[]; bytes: number }> {
  const files = form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  const text = String(form.get(`${field}Text`) ?? "").trim();
  if (files.length > MAX_FILES_PER_DOC) throw new UserError(`Please upload at most ${MAX_FILES_PER_DOC} files for the ${field === "bill" ? "bill" : "EOB"}.`);
  const docs: DocInput[] = [];
  let bytes = 0;
  for (const f of files) {
    if (!ALLOWED.has(f.type)) throw new UserError(`"${f.name}" isn't a supported file. Use PDF, JPG or PNG.`, 415);
    bytes += f.size;
    // Files are read into memory only; nothing is written to disk.
    docs.push({ kind: "file", mediaType: f.type, base64: Buffer.from(await f.arrayBuffer()).toString("base64") });
  }
  if (text) docs.push({ kind: "text", text: text.slice(0, MAX_TEXT) });
  return { docs, bytes };
}

export async function POST(request: Request) {
  const limit = rateLimit(`analyze:${clientIp(request)}`, 10);
  if (!limit.ok) {
    return Response.json(
      { error: `You've run a lot of checks in the last hour. Please try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.` },
      { status: 429 },
    );
  }

  try {
    const form = await request.formData();
    const bill = await readDocs(form, "bill");
    const eob = await readDocs(form, "eob");
    if (bill.docs.length === 0) throw new UserError("Please add your itemized bill (a file or pasted text).");
    if (eob.docs.length === 0) throw new UserError("Please add your EOB from the insurer (a file or pasted text).");
    if (bill.bytes + eob.bytes > MAX_TOTAL_BYTES) throw new UserError("Files are too large together (max about 4 MB). Try fewer pages or smaller photos.", 413);

    let context: PlanContext = {};
    const rawContext = form.get("context");
    if (rawContext) {
      const parsed = PlanContext.safeParse(JSON.parse(String(rawContext)));
      if (parsed.success) context = parsed.data;
    }

    // Two extractions in parallel; the model only transcribes.
    const [rawBill, rawEobs] = await Promise.all([extractBill(bill.docs), extractEobs(eob.docs)]);
    const { bill: billDoc, eobs } = redactAndNumber(rawBill, rawEobs);

    // The deterministic rules engine decides every flag and every dollar amount.
    const { flags, summary, matches } = runRules(billDoc, eobs, context);

    const analysis: Analysis = {
      analysisId: analysisIdFor({ bill: billDoc, eobs }),
      createdAt: new Date().toISOString(),
      bill: billDoc,
      eobs,
      context,
      matches,
      flags,
      summary,
    };
    return Response.json(analysis);
  } catch (err) {
    if (err instanceof UserError) return Response.json({ error: err.message }, { status: err.status });
    console.error("[analyze] unexpected error", (err as Error)?.name);
    return Response.json({ error: "Something went wrong while checking your bill. Please try again." }, { status: 500 });
  }
}
