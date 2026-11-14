import type { MerchantSummary, RecurringCandidate, Txn } from "./types";

const NOISE = [
  /^(pos|ach|debit|credit|card|purchase|recurring|payment|online|web|chk|checkcard|visa|mc)\b\s*/gi,
  /\b(debit card purchase|recurring payment|pos purchase|online payment)\b/gi,
];

export function normalizeMerchant(desc: string): string {
  let s = desc.toUpperCase();
  s = s.replace(/^(SQ|TST|SP|PY|PP|DD|IC|PAYPAL)\s*\*\s*/g, "");
  for (const re of NOISE) s = s.replace(re, "");
  s = s.replace(/\.(COM|NET|IO|CO)\b/g, "");
  s = s.replace(/[#*]/g, " ");
  s = s.replace(/\b\d[\d-]*\b/g, " ");
  s = s.replace(/\b(USA|US|INC|LLC|CA|NY|TX|WA|FL|BILL|HELP|SUBSCRIPTION|MEMBERSHIP)\b/g, " ");
  s = s.replace(/[^A-Z&+' ]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  const words = s.split(" ").filter(Boolean).slice(0, 2);
  return words.join(" ") || desc.toUpperCase().slice(0, 20);
}

export const BNPL_RE = /\b(KLARNA|AFFIRM|AFTERPAY|SEZZLE|ZIP\s?PAY|ZIP\b|PAY IN 4|PAYPAL PAY)/i;

export function monthsCovered(txns: Txn[]): number {
  if (txns.length === 0) return 1;
  const first = new Date(txns[0].date).getTime();
  const last = new Date(txns[txns.length - 1].date).getTime();
  const days = Math.max(1, (last - first) / 86_400_000 + 1);
  return Math.max(1, Math.round((days / 30.44) * 10) / 10);
}

export function summarizeMerchants(txns: Txn[]): MerchantSummary[] {
  const map = new Map<string, MerchantSummary>();
  for (const t of txns) {
    if (t.amount >= 0) continue;
    const key = normalizeMerchant(t.description);
    const abs = Math.abs(t.amount);
    const m = map.get(key) ?? { merchant: key, sample: t.description, count: 0, total: 0, avg: 0, amounts: [], dates: [] };
    m.count += 1;
    m.total += abs;
    m.amounts.push(abs);
    m.dates.push(t.date);
    map.set(key, m);
  }
  const list = [...map.values()].map((m) => ({ ...m, total: round(m.total), avg: round(m.total / m.count) }));
  list.sort((a, b) => b.total - a.total);
  return list;
}

export function detectRecurring(merchants: MerchantSummary[], months: number): RecurringCandidate[] {
  const out: RecurringCandidate[] = [];
  for (const m of merchants) {
    const distinctMonths = new Set(m.dates.map((d) => d.slice(0, 7))).size;
    const bnpl = BNPL_RE.test(m.sample) || BNPL_RE.test(m.merchant);
    if (m.count < 2 || distinctMonths < 2) continue;
    // recurring = roughly one charge per month with stable-ish amounts
    const perMonth = m.count / Math.max(1, distinctMonths);
    if (perMonth > 2.5 && !bnpl) continue; // e.g. coffee shop: habit, not subscription
    const first = m.amounts[0];
    const last = m.amounts[m.amounts.length - 1];
    const before = m.amounts.slice(0, -1);
    const sorted = [...m.amounts].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    // fixed-price subscription: earlier charges identical, last one may be higher (price hike)
    const fixedBefore = Math.max(...before) - Math.min(...before) <= Math.max(0.01, Math.min(...before) * 0.01);
    const priceHike = perMonth <= 1.2 && fixedBefore && last > first * 1.03 && last - first >= 0.5;
    // bills like utilities vary a bit month to month
    const stable = perMonth <= 1.2 && m.amounts.every((a) => Math.abs(a - median) / median <= 0.2);
    if (!stable && !priceHike && !bnpl) continue;
    const monthlyCost = bnpl ? m.total / Math.max(1, months) : (priceHike || fixedBefore ? last : median) * Math.min(perMonth, 1);
    out.push({
      merchant: m.merchant,
      sample: m.sample,
      monthlyCost: round(monthlyCost),
      occurrences: m.count,
      firstAmount: round(first),
      lastAmount: round(last),
      priceHike,
      bnpl,
    });
  }
  out.sort((a, b) => b.monthlyCost - a.monthlyCost);
  return out;
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}
