// Creates a Stripe Checkout session for the $5/month plan with a free trial.
// Uses Stripe's REST API directly; set STRIPE_SECRET_KEY (test mode: sk_test_...) in Vercel.
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return Response.json({ error: "Payments are not connected yet (demo mode)." }, { status: 200 });
  }
  let referral: string | null = null;
  try {
    referral = (await request.json())?.referral ?? null;
  } catch {}

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const trialDays = referral ? 60 : 30;
  const params = new URLSearchParams({
    mode: "subscription",
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancelled#pricing`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "500",
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": "FinanceBro Pro",
    "subscription_data[trial_period_days]": String(trialDays),
  });
  if (referral) params.set("metadata[referral]", String(referral).slice(0, 32));

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Stripe error", data);
    return Response.json({ error: "Checkout failed. Please try again." }, { status: 200 });
  }
  return Response.json({ url: data.url });
}
