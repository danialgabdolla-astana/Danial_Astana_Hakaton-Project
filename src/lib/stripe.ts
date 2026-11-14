import Stripe from "stripe";
import { UserError } from "./anthropic";

let client: Stripe | null = null;

/** Stripe in test mode. Without a key we fail loudly — we never unlock for free. */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new UserError("Payments aren't set up on this server yet (missing STRIPE_SECRET_KEY).", 503, "notConfigured");
  client ??= new Stripe(key);
  return client;
}

export const PLANS = {
  single: { name: "BillCheck — Fix this bill", amount: 1900, description: "Dispute letter, phone script, deadlines and tracker for one bill." },
  family: { name: "BillCheck — Family plan", amount: 5900, description: "Unlimited bills for one household for a year." },
} as const;
export type Plan = keyof typeof PLANS;

export function appUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
}
