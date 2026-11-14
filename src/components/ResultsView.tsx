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
import { apiErrorText } from "@/lib/i18n";
import { breakdownOf } from "@/lib/breakdown";
import { useMessages } from "@/lib/i18n/client";

export function ResultsView() {
  const m = useMessages();
  // Rendered client-only (see app/results/page.tsx), so reading the URL and localStorage here is safe.
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const [analysis] = useState<Analysis | null>(() => {
    const id = params.get("id") ?? store.lastAnalysisId();
    return id ? store.getAnalysis(id) : null;
  });
  const [token, setToken] = useState<string | null>(() => (analysis ? store.getUnlock(analysis.analysisId) : null));
  const [active, setActive] = useState<string | null>(null);
  // Notices are stored as keys so they follow a language switch.
  const [notice, setNotice] = useState<{ key: "canceled" | "paidFamily" | "paidSingle" } | { errorBody: unknown } | null>(() =>
    params.get("canceled") ? { key: "canceled" } : null,
  );
  const [verifying, setVerifying] = useState(() => !!(analysis && params.get("session_id")));

  useEffect(() => {
    const a = analysis;
    const sessionId = params.get("session_id");
    if (a && sessionId) {
      fetch(`/api/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then(async (r) => {
          const data = await r.json().catch(() => null);
          if (!r.ok || !data) throw new VerifyError(data);
          store.saveUnlock(data.token, data.scope);
          setToken(data.token);
          setNotice({ key: data.plan === "family" ? "paidFamily" : "paidSingle" });
          window.history.replaceState(null, "", `/results?id=${a.analysisId}`);
        })
        .catch((e) => setNotice({ errorBody: e instanceof VerifyError ? e.body : null }))
        .finally(() => setVerifying(false));
    }
  }, [analysis, params]);

  if (analysis === null) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <h1 className="text-2xl font-semibold">{m.results.notFoundTitle}</h1>
        <p className="mt-2 text-stone-600">{m.results.notFoundBody}</p>
        <Link href="/check" className="mt-6 inline-block rounded-xl bg-teal-700 px-5 py-3 font-medium text-white">
          {m.common.checkABill}
        </Link>
      </div>
    );
  }

  const { summary, flags } = analysis;
  const bd = breakdownOf(flags);
  const breakdownText =
    bd.mode === "lines"
      ? m.results.breakdown(
          bd.counted.map((f) => `${formatUsd(f.amountAtStake)} ${m.results.reasons[f.ruleId]}`),
          formatUsd(bd.total),
        )
      : bd.mode === "claim"
        ? m.results.breakdownClaim(formatUsd(bd.total), m.results.reasons[bd.counted[0].ruleId])
        : null;
  const counted = flags.filter((f) => f.confidence !== "low" && f.amountAtStake > 0);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {notice && (
        <p role="status" className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900 no-print">
          {"key" in notice ? m.results[notice.key] : apiErrorText(notice.errorBody, m, m.errors.verifyFailed)}
        </p>
      )}

      <section className="no-print rounded-2xl bg-stone-900 p-6 text-white sm:p-8">
        {summary.disputableTotal > 0 ? (
          <>
            <p className="text-sm uppercase tracking-wider text-teal-300">{analysis.bill.providerName}</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
              {m.results.overcharged} <span className="text-teal-300">{formatUsd(summary.disputableTotal)}</span>
            </h1>
          </>
        ) : (
          <h1 className="text-3xl font-semibold leading-tight">
            {flags.length ? m.results.nothingClear : m.results.allGood}
          </h1>
        )}
        <p className="mt-3 max-w-2xl text-stone-300">
          {m.results.summary({ bill: summary.billBalance, eob: summary.eobPatientResponsibility, issues: summary.issueCount, counted: counted.length })}
        </p>
      </section>

      <div className="no-print grid gap-6 lg:grid-cols-5">
        <section className="space-y-3 lg:col-span-2" aria-labelledby="issues">
          <h2 id="issues" className="text-lg font-semibold">
            {m.results.found}
          </h2>
          {flags.length === 0 && <p className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">{m.results.noIssues}</p>}
          {breakdownText && <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">{breakdownText}</p>}
          {flags.map((f) => (
            <FlagCard
              key={f.id}
              flag={f}
              status={bd.status[f.id]}
              active={active === f.id}
              onSelect={() => setActive(active === f.id ? null : f.id)}
            />
          ))}
          <p className="text-xs text-stone-500">{m.results.howWorks}</p>
        </section>
        <section className="lg:col-span-3" aria-labelledby="compare">
          <h2 id="compare" className="mb-3 text-lg font-semibold">
            {m.results.lineByLine}
          </h2>
          <SideBySide analysis={analysis} activeFlag={active} />
          <p className="mt-2 text-xs text-stone-500">{m.results.legend(analysis.bill.accountRef)}</p>
        </section>
      </div>

      {verifying ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center">{m.results.confirming}</p>
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

/** Carries the API's error body so it can be shown in the user's language. */
class VerifyError extends Error {
  constructor(public body: unknown) {
    super("verify failed");
  }
}
