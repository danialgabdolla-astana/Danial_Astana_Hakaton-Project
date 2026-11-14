"use client";

import { flagText } from "@/lib/i18n";
import { useMessages } from "@/lib/i18n/client";
import { formatUsd } from "@/lib/money";
import type { Flag } from "@/lib/schemas";

const CONF_CLASS: Record<Flag["confidence"], string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-sky-100 text-sky-900",
};

export function FlagCard({ flag, active, onSelect }: { flag: Flag; active: boolean; onSelect: () => void }) {
  const m = useMessages();
  const t = flagText(flag, m);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`w-full rounded-2xl border bg-white p-4 text-left transition hover:border-teal-600 ${active ? "border-teal-600 ring-2 ring-teal-600/20" : "border-stone-200"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold">{t.title}</h3>
        {flag.amountAtStake > 0 && <span className="text-lg font-semibold tabular-nums text-teal-800">{formatUsd(flag.amountAtStake)}</span>}
      </div>
      <p className="mt-1 text-sm text-stone-700">{t.explanation}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${CONF_CLASS[flag.confidence]}`}>{m.flag.conf[flag.confidence]}</span>
        <span className="text-stone-500">{m.flag.source(t.source)}</span>
      </div>
    </button>
  );
}
