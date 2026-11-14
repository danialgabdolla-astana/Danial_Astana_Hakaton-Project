"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/money";

export function Paywall({ analysisId, disputable }: { analysisId: string; disputable: number }) {
  const [loading, setLoading] = useState<"single" | "family" | null>(null);
  const [error, setError] = useState("");

  async function buy(plan: "single" | "family") {
    setLoading(plan);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, analysisId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-6" aria-labelledby="paywall-title">
      <h2 id="paywall-title" className="text-xl font-semibold">
        Get your dispute pack{disputable > 0 ? ` and go after ${formatUsd(disputable, false)}` : ""}
      </h2>
      <ul className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
        <li>✓ A ready-to-send letter to the billing office</li>
        <li>✓ A claim review request for your insurer, when needed</li>
        <li>✓ A phone script with the exact asks and escalation phrases</li>
        <li>✓ Deadlines + a tracker with a 30-day follow-up reminder</li>
      </ul>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => buy("single")}
          disabled={!!loading}
          className="rounded-xl bg-teal-700 px-5 py-3 text-left text-white shadow-sm hover:bg-teal-800 disabled:opacity-60"
        >
          <div className="text-lg font-semibold">{loading === "single" ? "Opening checkout…" : "Fix this bill — $19"}</div>
          <div className="text-sm text-teal-100">One-time. No % of your savings.</div>
        </button>
        <button
          onClick={() => buy("family")}
          disabled={!!loading}
          className="rounded-xl border border-teal-700 bg-white px-5 py-3 text-left hover:bg-teal-50 disabled:opacity-60"
        >
          <div className="text-lg font-semibold text-teal-900">{loading === "family" ? "Opening checkout…" : "Family plan — $59/year"}</div>
          <div className="text-sm text-stone-600">Every bill for your household, all year.</div>
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <p className="mt-4 rounded-lg bg-white/70 p-3 text-sm text-stone-600">
        <strong>Demo mode:</strong> payments run in Stripe test mode. Use card <span className="font-mono">4242 4242 4242 4242</span>, any future date, any
        CVC and any ZIP. No real money is charged.
      </p>
    </section>
  );
}
