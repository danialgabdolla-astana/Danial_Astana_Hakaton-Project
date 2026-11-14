import { z } from "zod";
import { errorBody, UserError } from "@/lib/anthropic";
import { writeDisputePack } from "@/lib/dispute";
import { analysisIdFor } from "@/lib/hash";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { runRules } from "@/lib/rules";
import { BillDoc, EobDoc, PlanContext } from "@/lib/schemas";
import { verifyUnlock } from "@/lib/unlock";

export const maxDuration = 120;

const Body = z.object({ bill: BillDoc, eobs: z.array(EobDoc), context: PlanContext.optional(), token: z.string() });

export async function POST(request: Request) {
  const limit = rateLimit(`letter:${clientIp(request)}`, 10);
  if (!limit.ok) return Response.json(errorBody("Too many letters in the last hour. Please try again later.", "rateLimitedLetter"), { status: 429 });

  try {
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new UserError("Invalid request.", 400, "invalidRequest");
    const { bill, eobs, context, token } = parsed.data;

    // The token is bound to a hash of these exact documents, so it can't be reused for another bill.
    let ok;
    try {
      ok = verifyUnlock(token, analysisIdFor({ bill, eobs }));
    } catch {
      throw new UserError("Unlocking isn't set up on this server (missing UNLOCK_SECRET).", 503, "notConfigured");
    }
    if (!ok) throw new UserError("Please unlock this bill first.", 402, "unlockFirst");

    // Never trust flags from the client: recompute them with the rules engine.
    const { flags, summary } = runRules(bill, eobs, context ?? {});
    const pack = await writeDisputePack(bill, eobs, flags, summary);
    return Response.json(pack);
  } catch (err) {
    if (err instanceof UserError) return Response.json(err.toJSON(), { status: err.status });
    console.error("[letter] unexpected error", (err as Error)?.name);
    return Response.json(errorBody("Something went wrong while writing your letter.", "letterFailed"), { status: 500 });
  }
}
