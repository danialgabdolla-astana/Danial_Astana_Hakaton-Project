"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { store } from "@/lib/client-store";
import { buildIcs, downloadText } from "@/lib/ics";
import { CaseLink } from "./CaseLink";
import { formatUsd } from "@/lib/money";
import { STATUSES, ensureDispute, getDisputes, isDisputeList, saveDisputes, today, type Dispute, type Status } from "@/lib/tracker";
import { SAMPLE_TOKEN } from "@/lib/client-store";
import { Analysis } from "@/lib/schemas";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { formatDate } from "@/lib/dates";

export function TrackerBoard() {
  const t = useMessages().tracker;
  const [list, setList] = useState<Dispute[]>(() => getDisputes());
  // Messages are kept as data so they follow a language switch.
  const [msg, setMsg] = useState<{ imported: number } | { bad: true } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function update(id: string, patch: Partial<Dispute>) {
    const next = list.map((d) => (d.id === id ? { ...d, ...patch } : d));
    setList(next);
    saveDisputes(next);
  }

  function remove(id: string) {
    if (!confirm(t.removeConfirm)) return;
    const next = list.filter((d) => d.id !== id);
    setList(next);
    saveDisputes(next);
  }

  function exportJson() {
    downloadText(`billcheck-disputes-${today()}.json`, JSON.stringify(list, null, 2), "application/json");
  }

  function importJson(file: File) {
    file.text().then((t) => {
      try {
        const data = JSON.parse(t);
        if (!isDisputeList(data)) throw new Error();
        const merged = [...data, ...list.filter((d) => !data.some((x: Dispute) => x.id === d.id))];
        setList(merged);
        saveDisputes(merged);
        setMsg({ imported: data.length });
      } catch {
        setMsg({ bad: true });
      }
    });
  }

  const checkABill = useMessages().common.checkABill;

  async function loadSample() {
    try {
      const a = Analysis.parse(await fetch("/samples/er.analysis.json").then((r) => r.json()));
      store.saveAnalysis(a);
      store.saveUnlock(SAMPLE_TOKEN, a.analysisId);
      ensureDispute(a);
      setList(getDisputes());
    } catch {
      /* offline: the empty state stays */
    }
  }
  const saved = list.reduce((s, d) => s + (d.status === "Resolved" ? d.amountSaved : 0), 0);
  const open = list.filter((d) => d.status !== "Resolved").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t.saved} value={formatUsd(saved, false)} accent />
        <Stat label={t.open} value={String(open)} />
        <Stat label={t.inDispute} value={formatUsd(list.filter((d) => d.status !== "Resolved").reduce((s, d) => s + d.disputable, 0), false)} />
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <button onClick={exportJson} disabled={!list.length} className="rounded-lg border border-stone-300 bg-white px-3 py-2 hover:bg-stone-100 disabled:opacity-50">
          {t.export}
        </button>
        <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-stone-300 bg-white px-3 py-2 hover:bg-stone-100">
          {t.import}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
        <span className="self-center text-stone-500">{t.storageNote}</span>
      </div>
      {msg && <p className="text-sm text-teal-800">{"imported" in msg ? t.imported(msg.imported) : t.badImport}</p>}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-stone-600">{t.empty}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/check" className="inline-block rounded-xl bg-teal-700 px-5 py-3 font-medium text-white">
              {checkABill}
            </Link>
            <button onClick={loadSample} className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-medium hover:bg-stone-100">
              {t.loadSample}
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((d) => (
            <DisputeCard key={d.id} d={d} onChange={(p) => update(d.id, p)} onRemove={() => remove(d.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DisputeCard({ d, onChange, onRemove }: { d: Dispute; onChange: (p: Partial<Dispute>) => void; onRemove: () => void }) {
  const [call, setCall] = useState({ date: today(), who: "", ref: "", notes: "" });
  const [showCall, setShowCall] = useState(false);
  const [analysis] = useState(() => store.getAnalysis(d.id));
  const t = useMessages().tracker;
  const locale = useLocale();
  const stepIndex = STATUSES.indexOf(d.status);

  function addCall() {
    if (!call.who && !call.notes) return;
    onChange({ calls: [{ id: crypto.randomUUID(), ...call }, ...d.calls], status: d.status === "Not started" || d.status === "Letter sent" ? "Called" : d.status });
    setCall({ date: today(), who: "", ref: "", notes: "" });
    setShowCall(false);
  }

  function calendar() {
    const ics = buildIcs({
      title: t.icsTitle(d.provider),
      date: new Date(d.followUpDate + "T09:00:00"),
      description: t.icsBody({ provider: d.provider, amount: formatUsd(d.disputable), sent: d.letterSentAt ? formatDate(d.letterSentAt, locale) : null }),
      uid: `${d.id}-${d.followUpDate}`,
    });
    downloadText(`billcheck-follow-up-${d.followUpDate}.ics`, ics, "text/calendar");
  }

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {d.provider}
            {analysis?.sample && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900">{t.sampleBadge}</span>}
          </h2>
          <p className="text-sm text-stone-600">{t.meta({ bill: formatUsd(d.billBalance), disputing: formatUsd(d.disputable), started: formatDate(d.createdAt, locale) })}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href={`/results?id=${d.id}`} className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-100">
            {t.openResults}
          </Link>
          <button onClick={onRemove} className="rounded-lg px-3 py-1.5 text-stone-500 hover:bg-stone-100" aria-label={t.removeAria(d.provider)}>
            {t.remove}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-600">
          <span>{t.otherDevice}</span>
          <CaseLink analysis={analysis} compact />
        </div>
      )}

      <ol className="mt-4 flex flex-wrap gap-1 text-xs sm:text-sm" aria-label={t.statusLabel}>
        {STATUSES.map((s, i) => (
          <li key={s}>
            <button
              onClick={() => onChange({ status: s as Status, letterSentAt: s === "Letter sent" && !d.letterSentAt ? today() : d.letterSentAt })}
              aria-current={d.status === s ? "step" : undefined}
              className={`rounded-full px-3 py-1.5 ${i < stepIndex ? "bg-teal-100 text-teal-900" : i === stepIndex ? "bg-teal-700 text-white" : "bg-stone-100 text-stone-600"}`}
            >
              {t.status[s]}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="text-stone-600">{t.followUp}</span>
          <input
            type="date"
            value={d.followUpDate}
            onChange={(e) => onChange({ followUpDate: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <div className="flex items-end">
          <button onClick={calendar} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100">
            {t.addCalendar}
          </button>
        </div>
        {d.status === "Resolved" ? (
          <label className="text-sm">
            <span className="text-stone-600">{t.amountSaved}</span>
            <input
              type="number"
              min={0}
              value={d.amountSaved || ""}
              onChange={(e) => onChange({ amountSaved: Number(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
        ) : (
          <div className="flex items-end text-sm text-stone-500">{t.markResolved}</div>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{t.callLog}</h3>
          <button onClick={() => setShowCall((v) => !v)} className="text-sm font-medium text-teal-800 hover:underline">
            {showCall ? t.cancel : t.logCall}
          </button>
        </div>
        {showCall && (
          <div className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3 sm:grid-cols-4">
            <input type="date" aria-label={t.callDate} value={call.date} onChange={(e) => setCall({ ...call, date: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            <input placeholder={t.who} aria-label={t.who} value={call.who} onChange={(e) => setCall({ ...call, who: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            <input placeholder={t.ref} aria-label={t.refAria} value={call.ref} onChange={(e) => setCall({ ...call, ref: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            <button onClick={addCall} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">
              {t.saveCall}
            </button>
            <textarea placeholder={t.notes} aria-label={t.notesAria} value={call.notes} onChange={(e) => setCall({ ...call, notes: e.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-4" rows={2} />
          </div>
        )}
        {d.calls.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">{t.noCalls}</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {d.calls.map((c) => (
              <li key={c.id} className="rounded-lg border border-stone-200 p-3">
                <div className="font-medium">
                  {formatDate(c.date, locale)} · {c.who || t.unknownRep}{" "}
                  {c.ref && (
                    <span className="text-stone-500">
                      · {t.refShort} {c.ref}
                    </span>
                  )}
                </div>
                {c.notes && <p className="text-stone-600">{c.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-teal-200 bg-teal-50" : "border-stone-200 bg-white"}`}>
      <div className="text-sm text-stone-600">{label}</div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${accent ? "text-teal-800" : ""}`}>{value}</div>
    </div>
  );
}
