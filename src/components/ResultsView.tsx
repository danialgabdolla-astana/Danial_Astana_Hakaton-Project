"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { store } from "@/lib/client-store";
import { formatUsd } from "@/lib/money";
import type { Analysis } from "@/lib/schemas";
import { FlagCard } from "./FlagCard";
import { SideBySide } from "./SideBySide";
import { Paywall } from "./Paywall";
import { DisputePackView } from "./DisputePackView";
import { CaseLink } from "./CaseLink";

export function ResultsView() {
  // Rendered client-only (see app/results/page.tsx), so reading the URL and localStorage here is safe.
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const [analysis] = useState<Analysis | null>(() => {
    const id = params.get("id") ?? store.lastAnalysisId();
    return id ? store.getAnalysis(id) : null;
  });
  const [token, setToken] = useState<string | null>(() => (analysis ? store.getUnlock(analysis.analysisId) : null));
  const [active, setActive] = useState<string | null>(null);
  const [notice, setNotice] = useState(() => (params.get("canceled") ? "Checkout was canceled — you haven't been charged." : ""));
  const [verifying, setVerifying] = useState(() => !!(analysis && params.get("session_id")));

  useEffect(() => {
    const a = analysis;
    const sessionId = params.get("session_id");
    if (a && sessionId) {
      fetch(`/api/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "We couldn't verify your payment.");
          store.saveUnlock(data.token, data.scope);
          setToken(data.token);
          setNotice(data.plan === "family" ? "Payment confirmed — Family plan active. 🎉" : "Payment confirmed — this bill is unlocked. 🎉");
          window.history.replaceState(null, "", `/results?id=${a.analysisId}`);
        })
        .catch((e) => setNotice((e as Error).message))
        .finally(() => setVerifying(false));
    }
  }, [analysis, params]);

  if (analysis === null) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <h1 className="text-2xl font-semibold">We couldn&apos;t find that check</h1>
        <p className="mt-2 text-stone-600">Results are stored only in the browser where you ran the check. If you saved a private case link, open it here.</p>
        <Link href="/check" className="mt-6 inline-block rounded-xl bg-teal-700 px-5 py-3 font-medium text-white">
          Check a bill
        </Link>
      </div>
    );
  }

  const { summary, flags } = analysis;
  const counted = flags.filter((f) => f.confidence !== "low" && f.amountAtStake > 0);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {notice && (
        <p role="status" className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900 no-print">
          {notice}
        </p>
      )}

      <section className="no-print rounded-2xl bg-stone-900 p-6 text-white sm:p-8">
        {summary.disputableTotal > 0 ? (
          <>
            <p className="text-sm uppercase tracking-wider text-teal-300">{analysis.bill.providerName}</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
              You may be overcharged <span className="text-teal-300">{formatUsd(summary.disputableTotal)}</span>
            </h1>
          </>
        ) : (
          <h1 className="text-3xl font-semibold leading-tight">
            {flags.length ? "Nothing clearly overcharged — but a few things are worth asking" : "Your bill matches your EOB 🎉"}
          </h1>
        )}
        <p className="mt-3 max-w-2xl text-stone-300">
          The bill asks for {formatUsd(summary.billBalance)}. Your insurer&apos;s EOB says you owe {formatUsd(summary.eobPatientResponsibility)}. We found{" "}
          {summary.issueCount} issue{summary.issueCount === 1 ? "" : "s"}
          {counted.length ? `; ${counted.length} count toward the disputable amount (each dollar counted once)` : ""}.
        </p>
      </section>

      <div className="no-print grid gap-6 lg:grid-cols-5">
        <section className="space-y-3 lg:col-span-2" aria-labelledby="issues">
          <h2 id="issues" className="text-lg font-semibold">
            What we found
          </h2>
          {flags.length === 0 && <p className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">No issues found.</p>}
          {flags.map((f) => (
            <FlagCard key={f.id} flag={f} active={active === f.id} onSelect={() => setActive(active === f.id ? null : f.id)} />
          ))}
          <p className="text-xs text-stone-500">
            How this works: AI only reads your documents. Every issue and dollar amount above comes from fixed billing rules you can read in our open-source code.
          </p>
        </section>
        <section className="lg:col-span-3" aria-labelledby="compare">
          <h2 id="compare" className="mb-3 text-lg font-semibold">
            Line by line
          </h2>
          <SideBySide analysis={analysis} activeFlag={active} />
          <p className="mt-2 text-xs text-stone-500">
            Red = high confidence · Amber = medium · Blue = worth asking. Names and IDs are masked ({analysis.bill.accountRef}).
          </p>
        </section>
      </div>

      {verifying ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center">Confirming your payment with Stripe…</p>
      ) : token ? (
        <DisputePackView analysis={analysis} token={token} />
      ) : (
        <div className="no-print">
          <Paywall analysisId={analysis.analysisId} disputable={summary.disputableTotal} />
        </div>
      )}

      <CaseLink analysis={analysis} />
    </main>
  );
}
