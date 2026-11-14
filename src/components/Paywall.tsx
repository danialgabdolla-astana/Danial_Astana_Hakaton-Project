"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/money";
import { apiErrorText } from "@/lib/i18n";
import { useLocale, useMessages } from "@/lib/i18n/client";

export function Paywall({ analysisId, disputable }: { analysisId: string; disputable: number }) {
  const [loading, setLoading] = useState<"single" | "family" | null>(null);
  const [error, setError] = useState<{ body: unknown } | null>(null);
  const locale = useLocale();
  const m = useMessages();
  const P = m.paywall;

  async function buy(plan: "single" | "family") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, analysisId, locale }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError({ body: data });
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError({ body: null });
      setLoading(null);
    }
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-6" aria-labelledby="paywall-title">
      <h2 id="paywall-title" className="text-xl font-semibold">
        {P.title(disputable > 0 ? formatUsd(disputable, false) : null)}
      </h2>
      <ul className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
        {P.items.map((i) => (
          <li key={i}>✓ {i}</li>
        ))}
      </ul>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => buy("single")}
          disabled={!!loading}
          className="rounded-xl bg-teal-700 px-5 py-3 text-left text-white shadow-sm hover:bg-teal-800 disabled:opacity-60"
        >
          <div className="text-lg font-semibold">{loading === "single" ? P.opening : P.single}</div>
          <div className="text-sm text-teal-100">{P.singleSub}</div>
        </button>
        <button
          onClick={() => buy("family")}
          disabled={!!loading}
          className="rounded-xl border border-teal-700 bg-white px-5 py-3 text-left hover:bg-teal-50 disabled:opacity-60"
        >
          <div className="text-lg font-semibold text-teal-900">{loading === "family" ? P.opening : P.family}</div>
          <div className="text-sm text-stone-600">{P.familySub}</div>
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {apiErrorText(error.body, m, m.errors.checkoutFailed)}
        </p>
      )}
      <p className="mt-4 rounded-lg bg-white/70 p-3 text-sm text-stone-600">
        <strong>{P.demoStrong}</strong> {P.demoPre} <span className="font-mono">4242 4242 4242 4242</span>
        {P.demoPost}
      </p>
    </section>
  );
}
