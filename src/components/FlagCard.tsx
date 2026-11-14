"use client";

import { Fragment } from "react";
import { flagText } from "@/lib/i18n";
import { useMessages } from "@/lib/i18n/client";
import { formatUsd } from "@/lib/money";
import type { Flag } from "@/lib/schemas";

const CONF_CLASS: Record<Flag["confidence"], string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-sky-100 text-sky-900",
};

const LINKS: [RegExp, string][] = [[/cms\.gov\/nosurprises/g, "https://www.cms.gov/nosurprises"]];

/** Turns known site names in a finding ("cms.gov/nosurprises") into real links. */
function withLinks(text: string) {
  const parts: React.ReactNode[] = [];
  let rest = text;
  for (const [re, href] of LINKS) {
    const chunks = rest.split(re);
    if (chunks.length === 1) continue;
    chunks.forEach((c, i) => {
      parts.push(<Fragment key={`t${i}`}>{c}</Fragment>);
      if (i < chunks.length - 1)
        parts.push(
          <a key={`a${i}`} href={href} target="_blank" rel="noreferrer" className="underline" onClick={(e) => e.stopPropagation()}>
            {re.source.replace(/\\/g, "")}
          </a>,
        );
    });
    rest = "";
  }
  return rest ? text : parts;
}

export function FlagCard({
  flag,
  status,
  active,
  onSelect,
}: {
  flag: Flag;
  /** Whether this amount is part of the total, already inside it, or a separate question. */
  status?: "counted" | "included" | "notAdded";
  active: boolean;
  onSelect: () => void;
}) {
  const m = useMessages();
  const t = flagText(flag, m);
  return (
    <div
      onClick={onSelect}
      className={`w-full cursor-pointer rounded-2xl border bg-white p-4 text-left transition hover:border-teal-600 ${active ? "border-teal-600 ring-2 ring-teal-600/20" : "border-stone-200"}`}
    >
      {/* The title is the real control (keyboard and screen readers); clicking anywhere on the card does the same. */}
      <button type="button" aria-pressed={active} onClick={(e) => (e.stopPropagation(), onSelect())} className="flex w-full flex-wrap items-start justify-between gap-2 text-left">
        <h3 className="font-semibold">{t.title}</h3>
        {flag.amountAtStake > 0 && (
          <span className={`text-lg font-semibold tabular-nums ${status && status !== "counted" ? "text-stone-400" : "text-teal-800"}`}>{formatUsd(flag.amountAtStake)}</span>
        )}
      </button>
      <p className="mt-1 text-sm text-stone-700">{withLinks(t.explanation)}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${CONF_CLASS[flag.confidence]}`}>{m.flag.conf[flag.confidence]}</span>
        {(status === "included" || status === "notAdded") && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-700">{status === "included" ? m.flag.included : m.flag.notAdded}</span>
        )}
        <span className="text-stone-500">{m.flag.source(t.source)}</span>
      </div>
    </div>
  );
}
