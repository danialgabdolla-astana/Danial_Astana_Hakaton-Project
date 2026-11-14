import { errorBody, UserError } from "@/lib/anthropic";
import { stripe } from "@/lib/stripe";
import { signUnlock } from "@/lib/unlock";

/**
 * Called when Stripe redirects back. We ask Stripe (server-to-server) whether the session was paid,
 * then return a signed unlock token. The client never decides it has paid.
 */
export async function GET(request: Request) {
  // Read the request first (outside try) so Next.js treats this route as dynamic.
  const sessionId = new URL(request.url).searchParams.get("session_id");
  try {
    if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new UserError("Missing or invalid session_id.", 400, "invalidRequest");

    const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const plan = session.metadata?.plan === "family" ? "family" : "single";
    const analysisId = session.metadata?.analysisId ?? "";

    const subscriptionActive =
      typeof session.subscription === "object" && session.subscription !== null && ["active", "trialing"].includes(session.subscription.status);
    const paid = session.payment_status === "paid" || subscriptionActive;
    if (!paid) throw new UserError("This payment hasn't been completed yet.", 402, "notPaid");

    const token = plan === "family" ? signUnlock("family", "family", 365) : signUnlock(analysisId, "single", 180);
    return Response.json({ token, scope: plan === "family" ? "family" : analysisId, plan });
  } catch (err) {
    if (err instanceof UserError) return Response.json(err.toJSON(), { status: err.status });
    if ((err as Error).message?.includes("UNLOCK_SECRET")) {
      return Response.json(errorBody("Unlocking isn't set up on this server (missing UNLOCK_SECRET).", "notConfigured"), { status: 503 });
    }
    console.error("[verify] error", (err as { type?: string }).type ?? (err as Error).name);
    return Response.json(errorBody("We couldn't verify the payment. Please refresh the page.", "verifyFailed"), { status: 502 });
  }
}
