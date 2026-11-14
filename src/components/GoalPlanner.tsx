"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RATE_30Y, RATE_SOURCE, addMonths, monthsToGoal, mortgage, usd } from "@/lib/finance";

type Props = { monthlySavingNow: number; freed: number; monthlyIncome: number; rent: number };

export function GoalPlanner({ monthlySavingNow, freed, monthlyIncome, rent }: Props) {
  const [price, setPrice] = useState(350000);
  const [downPct, setDownPct] = useState(10);
  const [saved, setSaved] = useState(2600);
  const [savingNow, setSavingNow] = useState(Math.round(monthlySavingNow));
  const [rate, setRate] = useState(DEFAULT_RATE_30Y);
  const [years, setYears] = useState(30);
  const [taxPct, setTaxPct] = useState(1.1);
  const [insurance, setInsurance] = useState(1800);

  useEffect(() => setSavingNow(Math.round(monthlySavingNow)), [monthlySavingNow]);

  const closingCosts = price * 0.03;
  const target = price * (downPct / 100) + closingCosts;
  const before = monthsToGoal(target, saved, savingNow);
  const after = monthsToGoal(target, saved, savingNow + freed);
  const sooner = before !== null && after !== null ? before - after : null;
  const progress = Math.min(100, (saved / target) * 100);

  const m = mortgage({ homePrice: price, downPct, ratePct: rate, years, taxRatePct: taxPct, insuranceYearly: insurance });
  const dti = monthlyIncome > 0 ? (m.total / monthlyIncome) * 100 : 0;

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold">🏠 Your first-home plan</h2>
        <p className="mb-4 text-sm text-stone-500">Down payment + ~3% closing costs. First-time buyers put down a median of 9% (NAR 2026).</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Home price" value={price} onChange={setPrice} prefix="$" step={5000} />
          <Field label="Down payment %" value={downPct} onChange={setDownPct} suffix="%" step={1} />
          <Field label="Already saved" value={saved} onChange={setSaved} prefix="$" step={100} />
          <Field label="You save now / mo" value={savingNow} onChange={setSavingNow} prefix="$" step={50} />
        </div>

        <div className="mt-5 rounded-xl bg-stone-50 p-4">
          <div className="flex justify-between text-sm">
            <span>Goal: {usd(target)}</span>
            <span className="text-stone-500">{progress.toFixed(0)}% there</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-stone-200">
            <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-stone-500">Today&apos;s pace</div>
              <div className="text-lg font-semibold">{before === null ? "Never" : `${before} months`}</div>
              {before !== null && <div className="text-stone-500">{addMonths(before)}</div>}
            </div>
            <div>
              <div className="text-stone-500">With fixes (+{usd(freed)}/mo)</div>
              <div className="text-lg font-semibold text-emerald-700">{after === null ? "Never" : `${after} months`}</div>
              {after !== null && <div className="text-emerald-700">{addMonths(after)}</div>}
            </div>
          </div>
          {sooner !== null && sooner > 0 && (
            <p className="mt-4 rounded-lg bg-emerald-600 px-3 py-2 text-center font-medium text-white">
              You get your keys {sooner} months sooner.
            </p>
          )}
          {before === null && after !== null && (
            <p className="mt-4 rounded-lg bg-emerald-600 px-3 py-2 text-center font-medium text-white">
              Fixing these leaks is what makes the goal possible.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Your future mortgage payment</h2>
        <p className="mb-4 text-sm text-stone-500">
          Default rate is the national average ({RATE_SOURCE}). Your actual rate depends on credit and lender.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rate" value={rate} onChange={setRate} suffix="%" step={0.05} />
          <label className="text-sm">
            <span className="text-stone-500">Term</span>
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            >
              <option value={30}>30 years</option>
              <option value={15}>15 years</option>
            </select>
          </label>
          <Field label="Property tax / yr" value={taxPct} onChange={setTaxPct} suffix="%" step={0.1} />
          <Field label="Home insurance / yr" value={insurance} onChange={setInsurance} prefix="$" step={100} />
        </div>
        <div className="mt-5 rounded-xl bg-stone-50 p-4">
          <div className="text-sm text-stone-500">Estimated monthly payment</div>
          <div className="text-3xl font-semibold">{usd(m.total)}</div>
          <div className="mt-3 space-y-1 text-sm">
            <Row k="Principal & interest" v={usd(m.principalInterest)} />
            <Row k="Property tax" v={usd(m.tax)} />
            <Row k="Insurance" v={usd(m.insurance)} />
            {m.pmi > 0 && <Row k="PMI (under 20% down)" v={usd(m.pmi)} />}
            <Row k="Loan amount" v={usd(m.loan)} />
          </div>
          {monthlyIncome > 0 && (
            <p className={`mt-4 text-sm ${dti <= 28 ? "text-emerald-700" : dti <= 36 ? "text-amber-700" : "text-red-700"}`}>
              That&apos;s {dti.toFixed(0)}% of your take-home pay
              {dti <= 28 ? " — comfortable." : dti <= 36 ? " — tight; try a lower price or more down." : " — too high for this price."}
            </p>
          )}
          {rent > 0 && (
            <p className="mt-1 text-sm text-stone-600">
              You pay {usd(rent)} in rent today ({m.total > rent ? `+${usd(m.total - rent)}` : `${usd(m.total - rent)}`}/mo vs. owning).
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="text-sm">
      <span className="text-stone-500">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-stone-300 bg-white px-3 focus-within:border-emerald-500">
        {prefix && <span className="text-stone-400">{prefix}</span>}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent py-2 pl-1 outline-none"
        />
        {suffix && <span className="text-stone-400">{suffix}</span>}
      </div>
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{k}</span>
      <span>{v}</span>
    </div>
  );
}
