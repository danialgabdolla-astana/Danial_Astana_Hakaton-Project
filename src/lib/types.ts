export type Txn = {
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // negative = money out, positive = money in
};

export type MerchantSummary = {
  merchant: string; // normalized key
  sample: string; // raw description example
  count: number;
  total: number; // absolute money out
  avg: number;
  amounts: number[]; // chronological absolute amounts
  dates: string[];
};

export type RecurringCandidate = {
  merchant: string;
  sample: string;
  monthlyCost: number;
  occurrences: number;
  firstAmount: number;
  lastAmount: number;
  priceHike: boolean;
  bnpl: boolean;
};

export type Category =
  | "Housing"
  | "Groceries"
  | "Dining & Delivery"
  | "Transport"
  | "Subscriptions"
  | "Shopping"
  | "Utilities & Phone"
  | "Insurance"
  | "Health & Fitness"
  | "BNPL & Debt"
  | "Entertainment"
  | "Travel"
  | "Other";

export const CATEGORIES: Category[] = [
  "Housing",
  "Groceries",
  "Dining & Delivery",
  "Transport",
  "Subscriptions",
  "Shopping",
  "Utilities & Phone",
  "Insurance",
  "Health & Fitness",
  "BNPL & Debt",
  "Entertainment",
  "Travel",
  "Other",
];

export type LeakType =
  | "unused_or_forgotten"
  | "duplicate_service"
  | "price_hike"
  | "cheaper_plan"
  | "bnpl_stack"
  | "habit";

export type Leak = {
  type: LeakType;
  merchants: string[];
  title: string;
  monthlySavings: number;
  why: string;
  action: string;
  confidence: "high" | "medium" | "low";
};

export type AnalysisRequest = {
  months: number;
  income: number; // total money in over the period
  merchants: MerchantSummary[];
  recurring: RecurringCandidate[];
};

export type AnalysisResult = {
  source: "claude" | "gemini" | "rules";
  categories: Record<string, Category>; // merchant -> category
  leaks: Leak[];
  summary: string;
};
