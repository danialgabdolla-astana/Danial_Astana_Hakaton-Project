"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseStatementCsv } from "@/lib/parse";
import { detectRecurring, monthsCovered, summarizeMerchants } from "@/lib/detect";
import type { AnalysisResult, Category, MerchantSummary, RecurringCandidate, Txn } from "@/lib/types";
import { usd } from "@/lib/finance";
import { buildRenewalCalendar } from "@/lib/ics";
import { CategoryChart } from "./CategoryChart";
import { LeakList } from "./LeakList";
import { GoalPlanner } from "./GoalPlanner";
import { Paywall } from "./Paywall";

type Stage = "idle" | "reading" | "thinking" | "done" | "error";

type Data = {
  txns: Txn[];
  months: number;
  income: number;
  spend: number;
  merchants: MerchantSummary[];
  recurring: RecurringCandidate[];
};

export default function App() {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fixed, setFixed] = useState<Set<number>>(new Set());
  const [ref, setRef] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("ref");
    if (r) setRef(r.slice(0, 32));
    if (params.get("checkout") === "success") setError("");
    setPaid(params.get("checkout") === "success");
  }, []);

  async function run(csv: string) {
    setError("");
    setStage("reading");
    const parsed = parseStatementCsv(csv);
    if (parsed.error) {
      setError(parsed.error);
      setStage("error");
      return;
    }
    const txns = parsed.txns;
    const months = monthsCovered(txns);
    const merchants = summarizeMerchants(txns);
    const recurring = detectRecurring(merchants, months);
    const income = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const spend = txns.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
    const d = { txns, months, income, spend, merchants, recurring };
    setData(d);
    setStage("thinking");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months, income, merchants, recurring }),
      });
      if (!res.ok) throw new Error(await res.text());
      const r: AnalysisResult = await res.json();
      setResult(r);
      setFixed(new Set(r.leaks.map((l, i) => (l.confidence !== "low" && l.monthlySavings > 0 ? i : -1)).filter((i) => i >= 0)));
      setStage("done");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError("Analysis failed. Please try again. " + String(e).slice(0, 120));
      setStage("error");
    }
  }

  async function loadSample() {
    const csv = await fetch("/sample-statement.csv").then((r) => r.text());
    run(csv);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5_000_000) {
      setError("File is too large (max 5 MB).");
      setStage("error");
      return;
    }
    f.text().then(run);
    e.target.value = "";
  }

  const byCategory = useMemo(() => {
    if (!data || !result) return [];
    const totals = new Map<Category, number>();
    for (const m of data.merchants) {
      const c = result.categories[m.merchant] ?? "Other";
      totals.set(c, (totals.get(c) ?? 0) + m.total / data.months);
    }
    return [...totals.entries()].map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  }, [data, result]);

  const subscriptions = useMemo(() => {
    if (!data || !result) return [];
    return data.recurring
      .filter(
        (r) =>
          !r.bnpl &&
          !["Housing", "Utilities & Phone", "Insurance", "BNPL & Debt", "Groceries"].includes(result.categories[r.merchant] ?? "Other"),
      )
      .map((r) => ({ ...r, lastDate: data.merchants.find((m) => m.merchant === r.merchant)?.dates.at(-1) ?? "" }));
  }, [data, result]);

  const freed = result ? result.leaks.reduce((s, l, i) => s + (fixed.has(i) ? l.monthlySavings : 0), 0) : 0;
  const monthlyIncome = data ? data.income / data.months : 0;
  const monthlySpend = data ? data.spend / data.months : 0;
  const monthlySaving = Math.max(0, monthlyIncome - monthlySpend);
  const rent = useMemo(() => {
    if (!data || !result) return 0;
    const h = data.merchants.filter((m) => result.categories[m.merchant] === "Housing");
    return h.reduce((s, m) => s + m.total, 0) / data.months;
  }, [data, result]);

  function downloadCalendar() {
    const ics = buildRenewalCalendar(subscriptions);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "financebro-renewals.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">F</span>
          FinanceBro
        </div>
        <a href="#pricing" className="text-sm text-stone-600 hover:text-stone-900">Pricing</a>
      </header>

      {paid && (
        <div className="mx-auto mb-2 max-w-5xl px-5">
          <div className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
            ✅ Welcome to FinanceBro Pro — your free month has started.
          </div>
        </div>
      )}
      {ref && (
        <div className="mx-auto mb-2 max-w-5xl px-5">
          <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            🎁 A friend invited you — you get an extra free month of Pro.
          </div>
        </div>
      )}

      <section className="mx-auto max-w-5xl px-5 pb-12 pt-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-700">For renters saving for a first home</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Your down payment is hiding in your bank statement.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600">
          Upload a statement. AI finds forgotten subscriptions, duplicate services, price hikes and stacked buy-now-pay-later plans —
          then turns that money into a dated plan for your first home.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            disabled={stage === "reading" || stage === "thinking"}
          >
            Upload bank statement (CSV)
          </button>
          <button
            onClick={loadSample}
            className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-medium hover:bg-stone-100 disabled:opacity-50"
            disabled={stage === "reading" || stage === "thinking"}
          >
            Try with a sample statement
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </div>
        <p className="mt-4 text-sm text-stone-500">
          🔒 No bank login. Your file is read in your browser; only merchant totals are sent for analysis, and nothing is stored.{" "}
          <a href="/sample-statement.csv" className="underline">See the CSV format</a>
        </p>

        {(stage === "reading" || stage === "thinking") && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span>{stage === "reading" ? "Reading your statement…" : "AI is looking for money leaks…"}</span>
          </div>
        )}
        {stage === "error" && <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      </section>

      {stage === "done" && data && result && (
        <main ref={resultsRef} className="mx-auto max-w-5xl space-y-8 px-5 pb-20">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Money in / month" value={usd(monthlyIncome)} />
            <Stat label="Money out / month" value={usd(monthlySpend)} />
            <Stat label="Left over / month" value={usd(monthlySaving)} />
            <Stat label="Leaks you can fix" value={`${usd(freed)}/mo`} sub={`${usd(freed * 12)} a year`} accent />
          </div>

          {result.summary && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500">
                AI summary
                <span className="rounded bg-stone-100 px-1.5 py-0.5 normal-case tracking-normal">
                  {result.source === "rules" ? "built-in rules" : result.source === "claude" ? "Claude" : "Gemini"}
                </span>
              </div>
              <p className="text-stone-700">{result.summary}</p>
              <p className="mt-2 text-xs text-stone-400">
                Based on {data.txns.length} transactions over {data.months} months.
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-3">
              <h2 className="text-lg font-semibold">Money leaks</h2>
              <p className="mb-4 text-sm text-stone-500">Tick what you will fix — it goes straight into your home plan below.</p>
              <LeakList
                leaks={result.leaks}
                fixed={fixed}
                onToggle={(i) =>
                  setFixed((prev) => {
                    const n = new Set(prev);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  })
                }
              />
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-2">
              <h2 className="text-lg font-semibold">Where it goes (per month)</h2>
              <CategoryChart data={byCategory} />
            </div>
          </div>

          {subscriptions.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  Your subscriptions: {usd(subscriptions.reduce((s, r) => s + r.monthlyCost, 0), 2)}/mo
                </h2>
                <button onClick={downloadCalendar} className="text-sm font-medium text-emerald-700 hover:underline">
                  📅 Add renewal reminders to my calendar
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {subscriptions.map((s) => (
                  <div key={s.merchant} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm">
                    <span className="truncate">{s.merchant}</span>
                    <span className="font-medium">
                      {usd(s.lastAmount, 2)}
                      {s.priceHike && <span className="ml-1 text-xs text-red-600">↑</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <GoalPlanner monthlySavingNow={monthlySaving} freed={freed} monthlyIncome={monthlyIncome} rent={rent} />
          <Paywall referral={ref} />
        </main>
      )}

      {stage !== "done" && (
        <div className="mx-auto max-w-5xl px-5 pb-20">
          <Paywall referral={ref} />
        </div>
      )}

      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-500">
        FinanceBro is a budgeting coach, not a licensed financial advisor. Mortgage figures are estimates.
      </footer>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-white"}`}>
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ? "text-emerald-700" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-emerald-700">{sub}</div>}
    </div>
  );
}
