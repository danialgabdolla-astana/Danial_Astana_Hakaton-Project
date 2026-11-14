import { z } from "zod";
import { UserError } from "@/lib/anthropic";
import { PLANS, appUrl, stripe } from "@/lib/stripe";

const Body = z.object({ plan: z.enum(["single", "family"]), analysisId: z.string().regex(/^[a-f0-9]{24}$/) });

/** Creates a Stripe Checkout Session with inline price_data (no dashboard setup needed). */
export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new UserError("Invalid checkout request.");
    const { plan, analysisId } = parsed.data;
    const p = PLANS[plan];
    const base = appUrl(request);

    const session = await stripe().checkout.sessions.create({
      mode: plan === "single" ? "payment" : "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: p.amount,
            product_data: { name: p.name, description: p.description },
            ...(plan === "family" ? { recurring: { interval: "year" as const } } : {}),
          },
        },
      ],
      metadata: { analysisId, plan },
      success_url: `${base}/results?id=${analysisId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/results?id=${analysisId}&canceled=1`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    if (err instanceof UserError) return Response.json({ error: err.message }, { status: err.status });
    console.error("[checkout] stripe error", (err as { type?: string }).type ?? (err as Error).name);
    return Response.json({ error: "We couldn't start checkout. Please try again." }, { status: 502 });
  }
}
