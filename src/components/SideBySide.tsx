"use client";

import { formatUsd } from "@/lib/money";
import type { Analysis, EobLine, Flag } from "@/lib/schemas";

const RULE_SHORT: Record<Flag["ruleId"], string> = {
  DUPLICATE_CHARGE: "Duplicate",
  BILL_EXCEEDS_EOB: "Over EOB",
  LINE_NOT_ON_EOB: "Not on EOB",
  NO_INSURANCE_APPLIED: "No insurance",
  BALANCE_BILLING_IN_NETWORK: "Balance billing",
  POSSIBLE_SURPRISE_BILL: "Surprise bill?",
  NOT_ITEMIZED: "Not itemized",
  POSSIBLE_UNBUNDLING: "Ask about bundling",
};

/** Bill lines on the left, the matching EOB line on the right; flagged rows are highlighted. */
export function SideBySide({ analysis, activeFlag }: { analysis: Analysis; activeFlag: string | null }) {
  const eobLines = analysis.eobs.flatMap((e) => e.lines);
  const eobById = new Map(eobLines.map((l) => [l.id, l]));
  const matchFor = new Map(analysis.matches.map((m) => [m.billLineId, m.eobLineId]));
  const flagsForBill = (id: string) => analysis.flags.filter((f) => f.billLineIds.includes(id));
  const flagsForEob = (id: string) => analysis.flags.filter((f) => f.eobLineIds.includes(id) && f.billLineIds.length > 0);
  const unmatchedEob = eobLines.filter((l) => !analysis.matches.some((m) => m.eobLineId === l.id));
  const active = analysis.flags.find((f) => f.id === activeFlag);

  const rowClass = (flags: Flag[], highlighted: boolean) => {
    const worst = flags.some((f) => f.confidence === "high") ? "high" : flags.some((f) => f.confidence === "medium") ? "medium" : flags.length ? "low" : null;
    const base = worst === "high" ? "bg-red-50" : worst === "medium" ? "bg-amber-50" : worst === "low" ? "bg-sky-50" : "";
    return `${base} ${highlighted ? "outline outline-2 -outline-offset-2 outline-teal-600" : ""}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50 text-sm font-semibold">
        <div className="px-4 py-3">
          Your bill <span className="font-normal text-stone-500">· {analysis.bill.providerName}</span>
        </div>
        <div className="border-l border-stone-200 px-4 py-3">
          Your EOB <span className="font-normal text-stone-500">· {analysis.eobs.map((e) => e.insurerName).join(", ")}</span>
        </div>
      </div>
      {analysis.bill.lines.length === 0 && <p className="p-4 text-sm text-stone-600">This bill has no line items. Ask for an itemized bill.</p>}
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
                  {b.serviceDate ?? "no date"} · {b.code ?? "no code"}
                </div>
                {flags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {flags.map((f) => (
                      <span key={f.id} className="rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-stone-300">
                        {RULE_SHORT[f.ruleId]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-l border-stone-200 px-4 py-3">
                {e ? <EobCell e={e} flags={flagsForEob(e.id)} /> : <span className="text-sm italic text-stone-500">No matching line on your EOB</span>}
              </div>
            </li>
          );
        })}
        {unmatchedEob.map((e) => (
          <li key={e.id} className="grid grid-cols-2 border-b border-stone-100 text-sm last:border-0">
            <div className="px-4 py-3 text-sm italic text-stone-500">Not on your bill</div>
            <div className="border-l border-stone-200 px-4 py-3">
              <EobCell e={e} flags={analysis.flags.filter((f) => f.eobLineIds.includes(e.id) && f.ruleId === "POSSIBLE_SURPRISE_BILL")} />
            </div>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 border-t border-stone-200 bg-stone-50 text-sm">
        <div className="flex justify-between px-4 py-3">
          <span>Bill asks you to pay</span>
          <strong className="tabular-nums">{formatUsd(analysis.summary.billBalance)}</strong>
        </div>
        <div className="flex justify-between border-l border-stone-200 px-4 py-3">
          <span>EOB says you owe</span>
          <strong className="tabular-nums">{formatUsd(analysis.summary.eobPatientResponsibility)}</strong>
        </div>
      </div>
    </div>
  );
}

function EobCell({ e, flags }: { e: EobLine; flags: Flag[] }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">
          <span className="mr-1 text-xs text-stone-400">{e.id}</span>
          {e.description}
        </span>
        <span className="tabular-nums" title="Your responsibility">
          {formatUsd(e.patientResponsibility)}
        </span>
      </div>
      <div className="text-xs text-stone-500">
        {e.code ?? "no code"} · billed {e.billedAmount != null ? formatUsd(e.billedAmount) : "—"} · allowed{" "}
        {e.allowedAmount != null ? formatUsd(e.allowedAmount) : "—"} · {e.networkStatus === "in" ? "in-network" : e.networkStatus === "out" ? "out-of-network" : "network unknown"}
      </div>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {flags.map((f) => (
            <span key={f.id} className="rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-stone-300">
              {RULE_SHORT[f.ruleId]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
