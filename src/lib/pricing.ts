/**
 * Launch pricing. The regular prices apply after launch; until then, BillCheck charges the launch price.
 * Amounts in cents (Stripe). The UI shows the regular price struck through next to the launch price.
 */
export const PRICES = {
  single: { regular: 2500, launch: 2000 }, // −20%
  family: { regular: 12000, launch: 6000 }, // −50%, per year
} as const;

export type PlanId = keyof typeof PRICES;

export const discountPct = (plan: PlanId) => Math.round((1 - PRICES[plan].launch / PRICES[plan].regular) * 100);
export const dollars = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
