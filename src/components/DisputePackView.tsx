"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { store } from "@/lib/client-store";
import { downloadText } from "@/lib/ics";
import type { Analysis } from "@/lib/schemas";
import type { DisputePack } from "@/lib/dispute";
import { addDays, ensureDispute, getDisputes, saveDisputes, today } from "@/lib/tracker";
import { MULTILINE, fillPlaceholders, findPlaceholders, letterDate } from "@/lib/placeholders";

type Tab = "letter" | "insurer" | "script" | "deadlines";

function fillPack(p: DisputePack, values: Record<string, string>): DisputePack {
  const f = (t: string) => fillPlaceholders(t, values);
  const s = p.phoneScript;
  return {
    ...p,
    billingLetter: f(p.billingLetter),
    insurerLetter: p.insurerLetter ? f(p.insurerLetter) : p.insurerLetter,
    phoneScript: {
      opening: f(s.opening),
      asks: s.asks.map(f),
      ifTheyPushBack: s.ifTheyPushBack.map(f),
      escalation: s.escalation.map(f),
      writeDown: s.writeDown.map(f),
    },
  };
}

function scriptText(p: DisputePack): string {
  const s = p.phoneScript;
  const list = (t: string, xs: string[]) => `${t}\n${xs.map((x) => `- ${x}`).join("\n")}`;
  return [
    "PHONE SCRIPT — BillCheck",
    `Opening:\n${s.opening}`,
    list("Ask for:", s.asks),
    list("If they push back:", s.ifTheyPushBack),
    list("Escalate:", s.escalation),
    list("Write down:", s.writeDown),
  ].join("\n\n");
}

export function DisputePackView({ analysis, token }: { analysis: Analysis; token: string }) {
  const router = useRouter();
  const [rawPack, setPack] = useState<DisputePack | null>(() => store.getPack<DisputePack>(analysis.analysisId));
  const [details, setDetails] = useState<Record<string, string>>(() => store.getDetails());
  const [showDetails, setShowDetails] = useState(false);
  const [tab, setTab] = useState<Tab>("letter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Writing to localStorage is a side effect, so it lives in an effect (no React state is set here).
  useEffect(() => {
    ensureDispute(analysis);
  }, [analysis]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: analysis.bill, eobs: analysis.eobs, context: analysis.context, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't write the letter.");
      store.savePack(analysis.analysisId, data);
      setPack(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function markSent() {
    const list = getDisputes().map((d) =>
      d.id === analysis.analysisId ? { ...d, status: "Letter sent" as const, letterSentAt: today(), followUpDate: addDays(today(), 30) } : d,
    );
    saveDisputes(list);
    router.push("/tracker");
  }

  function updateDetail(name: string, value: string) {
    const next = { ...details, [name]: value };
    setDetails(next);
    store.saveDetails(next);
  }

  if (!rawPack) {
    return (
      <section className="rounded-2xl border border-teal-200 bg-white p-6 text-center">
        <p className="text-sm font-medium text-teal-800">✓ Unlocked</p>
        <h2 className="mt-1 text-xl font-semibold">Your dispute pack is ready to write</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600">
          We&apos;ll write a letter and a phone script using only the issues found above — no new claims.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-5 rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {loading ? "Writing your letter… (about 30 seconds)" : "Write my letter & phone script"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>
    );
  }

  const s = rawPack.phoneScript;
  const fields = findPlaceholders(
    rawPack.billingLetter,
    rawPack.insurerLetter ?? "",
    s.opening,
    ...s.asks,
    ...s.ifTheyPushBack,
    ...s.escalation,
    ...s.writeDown,
  );
  const values: Record<string, string> = { Date: letterDate(), ...details };
  const filledCount = fields.filter((f) => values[f]?.trim()).length;
  const pack = fillPack(rawPack, values);
  const hints: Record<string, string> = {
    "Account number": analysis.bill.accountRef ? `on your bill, ends in ${analysis.bill.accountRef.slice(-4)}` : "on your bill",
    "Claim number": analysis.eobs[0]?.claimRef ? `on your EOB, ends in ${analysis.eobs[0].claimRef.slice(-4)}` : "on your EOB",
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "letter", label: "Letter to billing" },
    ...(pack.insurerLetter ? [{ id: "insurer" as const, label: "Request to insurer" }] : []),
    { id: "script", label: "Phone script" },
    { id: "deadlines", label: "Deadlines" },
  ];
  const current = tab === "letter" ? pack.billingLetter : tab === "insurer" ? pack.insurerLetter ?? "" : tab === "script" ? scriptText(pack) : "";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white">
      <div className="no-print flex flex-wrap gap-1 border-b border-stone-200 p-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-sm ${tab === t.id ? "bg-teal-700 font-medium text-white" : "text-stone-700 hover:bg-stone-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {fields.length > 0 && tab !== "deadlines" && (
        <div className="no-print border-b border-stone-200 bg-stone-50 px-5 py-3">
          <button
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className="flex w-full items-center justify-between gap-3 text-left text-sm"
          >
            <span>
              <span className="font-medium">Your details</span>{" "}
              <span className="text-stone-600">
                — {filledCount} of {fields.length} filled. Stays in this browser; never sent to our server.
              </span>
            </span>
            <span className="text-teal-800">{showDetails ? "Hide" : "Fill in"}</span>
          </button>
          {showDetails && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {fields.map((name) => {
                const id = `detail-${name.replace(/\W+/g, "-")}`;
                const common = {
                  id,
                  value: values[name] ?? "",
                  placeholder: hints[name] ?? "",
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateDetail(name, e.target.value),
                  className: "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm",
                };
                return (
                  <label key={name} htmlFor={id} className={`block text-sm ${MULTILINE.has(name) ? "sm:col-span-2" : ""}`}>
                    <span className="mb-1 block text-stone-700">{name}</span>
                    {MULTILINE.has(name) ? <textarea rows={2} {...common} /> : <input type="text" {...common} />}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {tab === "deadlines" ? (
          <ol className="space-y-3">
            {pack.deadlines.map((d, i) => (
              <li key={i} className="rounded-xl bg-stone-50 p-3">
                <div className="font-medium">
                  {d.daysFromNow !== null ? `${d.daysFromNow === 0 ? "Today" : `In ${d.daysFromNow} day${d.daysFromNow > 1 ? "s" : ""}`} — ` : ""}
                  {d.title}
                </div>
                <div className="text-sm text-stone-600">{d.detail}</div>
              </li>
            ))}
          </ol>
        ) : tab === "script" ? (
          <div className="print-area space-y-4 text-[15px] leading-relaxed">
            <Block title="Opening">{pack.phoneScript.opening}</Block>
            <ListBlock title="Ask for" items={pack.phoneScript.asks} />
            <ListBlock title="If they push back" items={pack.phoneScript.ifTheyPushBack} />
            <ListBlock title="Escalate" items={pack.phoneScript.escalation} />
            <ListBlock title="Write down" items={pack.phoneScript.writeDown} />
          </div>
        ) : (
          <pre className="print-area whitespace-pre-wrap font-sans text-[15px] leading-relaxed">{current}</pre>
        )}

        {tab !== "deadlines" && (
          <div className="no-print mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(current);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              onClick={() => downloadText(`billcheck-${tab}.txt`, current)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
            >
              Download .txt
            </button>
            <button onClick={() => window.print()} className="rounded-lg border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100">
              Print / Save as PDF
            </button>
          </div>
        )}
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 p-4">
        <p className="text-sm text-stone-600">
          {filledCount < fields.length ? "Fill in your details above, send it, " : "Send it, "}then track the dispute until it&apos;s resolved.
        </p>
        <div className="flex gap-2">
          <button onClick={markSent} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            I sent the letter → track it
          </button>
          <Link href="/tracker" className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-100">
            Open tracker
          </Link>
        </div>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
