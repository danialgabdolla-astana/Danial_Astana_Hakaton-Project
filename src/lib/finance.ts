// Freddie Mac PMMS, week of Nov 5, 2026: 30-year fixed averaged 7.18%.
export const DEFAULT_RATE_30Y = 7.18;
export const RATE_SOURCE = "Freddie Mac PMMS, Nov 5, 2026";

export type MortgageInput = {
  homePrice: number;
  downPct: number; // 0-100
  ratePct: number;
  years: number;
  taxRatePct: number; // annual property tax as % of price
  insuranceYearly: number;
};

export type MortgageOutput = {
  loan: number;
  principalInterest: number;
  tax: number;
  insurance: number;
  pmi: number;
  total: number;
  totalInterest: number;
};

export function mortgage(i: MortgageInput): MortgageOutput {
  const down = i.homePrice * (i.downPct / 100);
  const loan = Math.max(0, i.homePrice - down);
  const r = i.ratePct / 100 / 12;
  const n = i.years * 12;
  const pi = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
  const tax = (i.homePrice * (i.taxRatePct / 100)) / 12;
  const insurance = i.insuranceYearly / 12;
  // PMI roughly 0.5%-1% of loan per year when down payment < 20%
  const pmi = i.downPct < 20 ? (loan * 0.0075) / 12 : 0;
  return {
    loan,
    principalInterest: pi,
    tax,
    insurance,
    pmi,
    total: pi + tax + insurance + pmi,
    totalInterest: pi * n - loan,
  };
}

/** Highest home price whose full monthly payment fits within `share` of monthly take-home pay. */
export function affordablePrice(monthlyIncome: number, share: number, i: Omit<MortgageInput, "homePrice">): number {
  const budget = monthlyIncome * share - i.insuranceYearly / 12;
  if (budget <= 0) return 0;
  const d = i.downPct / 100;
  const r = i.ratePct / 100 / 12;
  const n = i.years * 12;
  const piPerLoanDollar = r === 0 ? 1 / n : r / (1 - Math.pow(1 + r, -n));
  const pmiPerLoanDollar = i.downPct < 20 ? 0.0075 / 12 : 0;
  const perPriceDollar = (1 - d) * (piPerLoanDollar + pmiPerLoanDollar) + i.taxRatePct / 100 / 12;
  return Math.floor(budget / perPriceDollar / 1000) * 1000;
}

export type GoalInput = {
  target: number;
  saved: number;
  monthlyNow: number; // what they currently manage to save per month
  monthlyExtra: number; // freed by fixing leaks
};

export function monthsToGoal(target: number, saved: number, monthly: number): number | null {
  const left = target - saved;
  if (left <= 0) return 0;
  if (monthly <= 0) return null;
  return Math.ceil(left / monthly);
}

export function addMonths(months: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + months, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export const usd = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });
