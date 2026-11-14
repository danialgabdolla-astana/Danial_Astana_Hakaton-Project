"use client";

import type { Leak } from "@/lib/types";
import { usd } from "@/lib/finance";

const LABEL: Record<Leak["type"], string> = {
  unused_or_forgotten: "Forgotten",
  duplicate_service: "Duplicate",
  price_hike: "Price hike",
  cheaper_plan: "Cheaper plan",
  bnpl_stack: "BNPL",
  habit: "Habit",
};

export function LeakList({ leaks, fixed, onToggle }: { leaks: Leak[]; fixed: Set<number>; onToggle: (i: number) => void }) {
  if (leaks.length === 0) return <p className="text-sm text-stone-500">No obvious leaks found — nice work.</p>;
  return (
    <ul className="space-y-3">
      {leaks.map((l, i) => {
        const on = fixed.has(i);
        const informational = l.monthlySavings <= 0;
        return (
          <li key={i} className={`rounded-xl border p-4 transition ${on ? "border-emerald-300 bg-emerald-50/50" : "border-stone-200"}`}>
            <div className="flex items-start gap-3">
              {!informational ? (
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle(i)}
                  className="mt-1 h-4 w-4 accent-emerald-600"
                  aria-label={`Fix: ${l.title}`}
                />
              ) : (
                <span className="mt-0.5 text-amber-500">⚠</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium">
                    {l.title}{" "}
                    <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-xs font-normal text-stone-600">{LABEL[l.type]}</span>
                  </div>
                  {!informational && <div className="font-semibold text-emerald-700">+{usd(l.monthlySavings, 0)}/mo</div>}
                </div>
                <p className="mt-1 text-sm text-stone-600">{l.why}</p>
                <p className="mt-1 text-sm">
                  <span className="font-medium">Do this: </span>
                  {l.action}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
