"use client";

import { formatUsd, round2 } from "@/lib/money";
import type { Analysis, EobLine, Flag } from "@/lib/schemas";
import { useMessages } from "@/lib/i18n/client";

/** Bill lines on the left, the matching EOB line on the right; flagged rows are highlighted. */
export function SideBySide({ analysis, activeFlag }: { analysis: Analysis; activeFlag: string | null }) {
  const t = useMessages().sbs;
  const eobLines = analysis.eobs.flatMap((e) => e.lines);
  const eobById = new Map(eobLines.map((l) => [l.id, l]));
  const matchFor = new Map(analysis.matches.map((m) => [m.billLineId, m.eobLineId]));
  const flagsForBill = (id: string) => analysis.flags.filter((f) => f.billLineIds.includes(id));
  const flagsForEob = (id: string) => analysis.flags.filter((f) => f.eobLineIds.includes(id) && f.billLineIds.length > 0);
  const unmatchedEob = eobLines.filter((l) => !analysis.matches.some((m) => m.eobLineId === l.id));
  const active = analysis.flags.find((f) => f.id === activeFlag);
  // Explains how listed charges become the balance due (insurance payments and contractual adjustments).
  const chargesListed = round2(analysis.bill.lines.reduce((s, l) => s + l.billedAmount, 0));
  const reconcile = analysis.bill.lines.length ? round2(chargesListed - analysis.summary.billBalance) : 0;

  const rowClass = (flags: Flag[], highlighted: boolean) => {
    const worst = flags.some((f) => f.confidence === "high") ? "high" : flags.some((f) => f.confidence === "medium") ? "medium" : flags.length ? "low" : null;
    const base = worst === "high" ? "bg-red-50" : worst === "medium" ? "bg-amber-50" : worst === "low" ? "bg-sky-50" : "";
    return `${base} ${highlighted ? "outline outline-2 -outline-offset-2 outline-teal-600" : ""}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50 text-sm font-semibold">
        <div className="px-4 py-3">
          {t.yourBill} <span className="font-normal text-stone-500">· {analysis.bill.providerName}</span>
        </div>
        <div className="border-l border-stone-200 px-4 py-3">
          {t.yourEob} <span className="font-normal text-stone-500">· {analysis.eobs.map((e) => e.insurerName).join(", ")}</span>
        </div>
      </div>
      {analysis.bill.lines.length === 0 && <p className="p-4 text-sm text-stone-600">{t.noLines}</p>}
      <ul>
        {analysis.bill.lines.map((b) => {
          const eobId = matchFor.get(b.id) ?? null;
          const e = eobId ? eobById.get(eobId) : undefined;
          const flags = flagsForBill(b.id);
          const highlighted = !!active && (active.billLineIds.includes(b.id) || (!!eobId && active.eobLineIds.includes(eobId)));
          return (
            <li key={b.id} className={`grid grid-cols-2 border-b border-stone-100 text-sm last:border-0 ${rowClass(flags, highlighted)}`}>
              <div className="space-y-1 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    <span className="mr-1 text-xs text-stone-400">{b.id}</span>
                    {b.description}
                  </span>
                  <span className="tabular-nums">{formatUsd(b.billedAmount)}</span>
                </div>
                <div className="text-xs text-stone-500">
                  {b.serviceDate ?? t.noDate} · {b.code ?? t.noCode}
                </div>
                {flags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {flags.map((f) => (
                      <span key={f.id} className="rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-stone-300">
                        {t.short[f.ruleId]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-l border-stone-200 px-4 py-3">
                {e ? <EobCell e={e} flags={flagsForEob(e.id)} /> : <span className="text-sm italic text-stone-500">{t.noMatch}</span>}
              </div>
            </li>
          );
        })}
        {unmatchedEob.map((e) => (
          <li key={e.id} className="grid grid-cols-2 border-b border-stone-100 text-sm last:border-0">
            <div className="px-4 py-3 text-sm italic text-stone-500">{t.notOnBill}</div>
            <div className="border-l border-stone-200 px-4 py-3">
              <EobCell e={e} flags={analysis.flags.filter((f) => f.eobLineIds.includes(e.id) && f.ruleId === "POSSIBLE_SURPRISE_BILL")} />
            </div>
          </li>
        ))}
      </ul>
      {reconcile !== 0 && (
        <div className="grid grid-cols-2 border-t border-stone-200 text-sm text-stone-600">
          <div className="space-y-1 px-4 py-3">
            <div className="flex justify-between gap-2">
              <span>{t.chargesListed}</span>
              <span className="tabular-nums">{formatUsd(chargesListed)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>{reconcile > 0 ? t.paidAdjustments : t.otherBalance}</span>
              <span className="tabular-nums">{reconcile > 0 ? "−" : "+"}{formatUsd(Math.abs(reconcile))}</span>
            </div>
          </div>
          <div className="border-l border-stone-200" />
        </div>
      )}
      <div className="grid grid-cols-2 border-t border-stone-200 bg-stone-50 text-sm">
        <div className="flex justify-between px-4 py-3">
          <span>{t.billAsks}</span>
          <strong className="tabular-nums">{formatUsd(analysis.summary.billBalance)}</strong>
        </div>
        <div className="flex justify-between border-l border-stone-200 px-4 py-3">
          <span>{t.eobSays}</span>
          <strong className="tabular-nums">{formatUsd(analysis.summary.eobPatientResponsibility)}</strong>
        </div>
      </div>
    </div>
  );
}

function EobCell({ e, flags }: { e: EobLine; flags: Flag[] }) {
  const t = useMessages().sbs;
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">
          <span className="mr-1 text-xs text-stone-400">{e.id}</span>
          {e.description}
        </span>
        <span className="tabular-nums" title={t.yourResp}>
          {formatUsd(e.patientResponsibility)}
        </span>
      </div>
      <div className="text-xs text-stone-500">
        {e.code ?? t.noCode} · {t.billed} {e.billedAmount != null ? formatUsd(e.billedAmount) : "—"} · {t.allowed}{" "}
        {e.allowedAmount != null ? formatUsd(e.allowedAmount) : "—"} · {t.network[e.networkStatus]}
      </div>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flags.map((f) => (
            <span key={f.id} className="rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-stone-300">
              {t.short[f.ruleId]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
