import Papa from "papaparse";
import type { Txn } from "./types";

const DATE_KEYS = ["date", "transaction date", "posted date", "post date", "posting date", "trans date"];
const DESC_KEYS = ["description", "merchant", "name", "payee", "details", "memo", "transaction"];
const AMOUNT_KEYS = ["amount", "transaction amount", "amt"];
const DEBIT_KEYS = ["debit", "withdrawal", "withdrawals", "money out", "outflow"];
const CREDIT_KEYS = ["credit", "deposit", "deposits", "money in", "inflow"];

function findKey(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i >= 0) return headers[i];
  }
  for (const c of candidates) {
    const i = lower.findIndex((h) => h.includes(c));
    if (i >= 0) return headers[i];
  }
  return undefined;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return NaN;
  let s = String(v).trim();
  if (!s) return NaN;
  let neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$,\s]/g, "");
  if (s.endsWith("-")) {
    neg = true;
    s = s.slice(0, -1);
  }
  const n = parseFloat(s);
  if (Number.isNaN(n)) return NaN;
  return neg ? -Math.abs(n) : n;
}

function toIsoDate(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export type ParseResult = { txns: Txn[]; error?: string };

export function parseStatementCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });
  const headers = parsed.meta.fields ?? [];
  if (headers.length < 2) return { txns: [], error: "Could not read columns. Please upload a CSV export from your bank." };

  const dateKey = findKey(headers, DATE_KEYS);
  const descKey = findKey(headers, DESC_KEYS);
  const amountKey = findKey(headers, AMOUNT_KEYS);
  const debitKey = findKey(headers, DEBIT_KEYS);
  const creditKey = findKey(headers, CREDIT_KEYS);

  if (!dateKey || !descKey || (!amountKey && !debitKey)) {
    return {
      txns: [],
      error: `We need Date, Description and Amount (or Debit/Credit) columns. Found: ${headers.join(", ")}`,
    };
  }

  const txns: Txn[] = [];
  for (const row of parsed.data) {
    const date = toIsoDate(row[dateKey]);
    const description = String(row[descKey] ?? "").trim();
    if (!date || !description) continue;
    let amount: number;
    if (amountKey) {
      amount = toNumber(row[amountKey]);
    } else {
      const debit = toNumber(row[debitKey!]);
      const credit = creditKey ? toNumber(row[creditKey]) : NaN;
      amount = (Number.isNaN(credit) ? 0 : Math.abs(credit)) - (Number.isNaN(debit) ? 0 : Math.abs(debit));
    }
    if (Number.isNaN(amount) || amount === 0) continue;
    txns.push({ date, description, amount });
  }

  if (txns.length === 0) return { txns: [], error: "No transactions found in this file." };

  // Some banks export spending as positive numbers. If almost everything is positive
  // and there is an explicit type column, we can't know; heuristic: if >80% positive
  // and the largest values look like spending, flip all but obvious income.
  const positives = txns.filter((t) => t.amount > 0).length;
  if (amountKey && positives / txns.length > 0.8) {
    for (const t of txns) {
      const isIncome = /payroll|salary|direct dep|deposit|refund|transfer from|zelle from|venmo from/i.test(t.description);
      t.amount = isIncome ? Math.abs(t.amount) : -Math.abs(t.amount);
    }
  }

  txns.sort((a, b) => a.date.localeCompare(b.date));
  return { txns };
}
