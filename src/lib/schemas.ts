import { z } from "zod";
import { toUsd } from "./money";

/** Money fields accept numbers or strings like "$1,240.00" and normalize to a number of USD. */
const money = z.preprocess((v) => (typeof v === "string" ? toUsd(v) : v), z.number());
const moneyOrNull = z.preprocess((v) => (v === undefined ? null : typeof v === "string" ? toUsd(v) : v), z.number().nullable());
const isoDateOrNull = z.preprocess(
  (v) => (v === undefined || v === "" ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable(),
);
const strOrNull = z.preprocess((v) => (v === undefined || v === "" ? null : v), z.string().nullable());

export const BillLine = z.object({
  id: z.string(),
  serviceDate: isoDateOrNull,
  code: strOrNull,
  codeType: z.preprocess((v) => (v === undefined ? null : v), z.enum(["CPT", "HCPCS", "REV", "OTHER"]).nullable()),
  description: z.string(),
  quantity: z.preprocess((v) => (v === undefined ? null : v), z.number().nullable()),
  billedAmount: money,
});
export type BillLine = z.infer<typeof BillLine>;

export const BillDoc = z.object({
  providerName: z.string(),
  accountRef: z.string(),
  statementDate: isoDateOrNull,
  dueDate: isoDateOrNull,
  isItemized: z.boolean(),
  lines: z.array(BillLine),
  totalCharges: moneyOrNull,
  insurancePaid: moneyOrNull,
  adjustments: moneyOrNull,
  patientBalance: money,
});
export type BillDoc = z.infer<typeof BillDoc>;

export const NetworkStatus = z.enum(["in", "out", "unknown"]);

export const EobLine = z.object({
  id: z.string(),
  serviceDate: isoDateOrNull,
  code: strOrNull,
  description: z.string(),
  billedAmount: moneyOrNull,
  allowedAmount: moneyOrNull,
  planPaid: moneyOrNull,
  deductible: moneyOrNull,
  copay: moneyOrNull,
  coinsurance: moneyOrNull,
  notCovered: moneyOrNull,
  patientResponsibility: money,
  remarkCodes: z.preprocess((v) => (v == null ? [] : v), z.array(z.string())),
  networkStatus: z.preprocess((v) => (v == null ? "unknown" : v), NetworkStatus),
});
export type EobLine = z.infer<typeof EobLine>;

export const EobDoc = z.object({
  insurerName: z.string(),
  claimRef: z.string(),
  providerName: strOrNull,
  lines: z.array(EobLine),
  totalPatientResponsibility: money,
});
export type EobDoc = z.infer<typeof EobDoc>;

export const PlanContext = z.object({
  deductible: z.number().nonnegative().optional(),
  deductibleMet: z.number().nonnegative().optional(),
  coinsurancePct: z.number().min(0).max(100).optional(),
  outOfPocketMax: z.number().nonnegative().optional(),
  inNetwork: z.boolean().optional(),
});
export type PlanContext = z.infer<typeof PlanContext>;

export const Confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof Confidence>;

export const RuleId = z.enum([
  "DUPLICATE_CHARGE",
  "BILL_EXCEEDS_EOB",
  "LINE_NOT_ON_EOB",
  "NO_INSURANCE_APPLIED",
  "BALANCE_BILLING_IN_NETWORK",
  "POSSIBLE_SURPRISE_BILL",
  "NOT_ITEMIZED",
  "POSSIBLE_UNBUNDLING",
]);
export type RuleId = z.infer<typeof RuleId>;

export const Flag = z.object({
  id: z.string(),
  ruleId: RuleId,
  title: z.string(),
  explanation: z.string(),
  billLineIds: z.array(z.string()),
  eobLineIds: z.array(z.string()),
  amountAtStake: z.number(),
  confidence: Confidence,
  source: z.string(),
});
export type Flag = z.infer<typeof Flag>;

export const Summary = z.object({
  issueCount: z.number(),
  disputableTotal: z.number(),
  billBalance: z.number(),
  eobPatientResponsibility: z.number(),
});
export type Summary = z.infer<typeof Summary>;

/** What /api/analyze returns. The id is a hash of the extracted documents. */
export const Analysis = z.object({
  analysisId: z.string(),
  createdAt: z.string(),
  bill: BillDoc,
  eobs: z.array(EobDoc),
  context: PlanContext.optional(),
  matches: z.array(z.object({ billLineId: z.string(), eobLineId: z.string().nullable() })),
  flags: z.array(Flag),
  summary: Summary,
});
export type Analysis = z.infer<typeof Analysis>;

/** What the letter model must return (validated server-side before it reaches the user). */
export const DisputePack = z.object({
  billingLetter: z.string().min(200),
  insurerLetter: z.string().nullable(),
  phoneScript: z.object({
    opening: z.string(),
    asks: z.array(z.string()).min(1),
    ifTheyPushBack: z.array(z.string()),
    escalation: z.array(z.string()).min(1),
    writeDown: z.array(z.string()).min(1),
  }),
});

export const Deadline = z.object({ title: z.string(), detail: z.string(), daysFromNow: z.number().nullable() });
export type Deadline = z.infer<typeof Deadline>;

/** A dispute pack as the client stores it: the model's output plus rule-based deadlines. */
export const StoredPack = DisputePack.extend({ deadlines: z.array(Deadline) });
export type DisputePack = z.infer<typeof StoredPack>;
