"use client";

import { useEffect, useState } from "react";
import { caseLinkFor } from "@/lib/case-link";
import type { Analysis } from "@/lib/schemas";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { emailEnabled, getEmailPref, sendCaseEmail, setEmailPref } from "@/lib/notify";

/**
 * "Save your case" without an account: a private link that carries the whole case in its #fragment.
 * Built on click so it always includes the latest letter and tracker status.
 */
export function CaseLink({ analysis, compact = false }: { analysis: Analysis; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const t = useMessages().caseLink;
  const locale = useLocale();
  // Server email is optional: without SMTP settings the button opens the user's own mail app instead.
  const [serverEmail, setServerEmail] = useState(false);
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [updates, setUpdates] = useState(true);
  const [send, setSend] = useState<{ s: "idle" | "sending" } | { s: "sent"; to: string } | { s: "error"; code: string }>({ s: "idle" });
  const [pref, setPref] = useState<{ to: string; updates: boolean } | null>(null);

  useEffect(() => {
    let live = true;
    emailEnabled().then((on) => live && setServerEmail(on));
    const p = getEmailPref();
    // Read after mount: localStorage isn't available during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPref(p);
    if (p) {
      setTo(p.to);
      setUpdates(p.updates);
    }
    return () => {
      live = false;
    };
  }, []);

  async function sendNow(e: React.FormEvent) {
    e.preventDefault();
    const addr = to.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return setSend({ s: "error", code: "badEmail" });
    setSend({ s: "sending" });
    const err = await sendCaseEmail(addr, "case", analysis, locale);
    if (err) return setSend({ s: "error", code: err });
    const p = { to: addr, updates };
    setEmailPref(p);
    setPref(p);
    setSend({ s: "sent", to: addr });
  }

  function stop() {
    setEmailPref(null);
    setPref(null);
    setUpdates(false);
  }

  async function copy() {
    try {
      const url = await caseLinkFor(analysis);
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
    }
  }

  async function email() {
    if (serverEmail) return setOpen((o) => !o);
    try {
      const url = await caseLinkFor(analysis);
      const subject = t.mailSubject(analysis.bill.providerName);
      const body = t.mailBody(url);
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch {
      setState("error");
    }
  }

  const buttons = (
    <div className="flex flex-wrap gap-2">
      <button onClick={copy} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">
        {state === "copied" ? t.copied : t.copy}
      </button>
      <button onClick={email} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">
        {t.email}
      </button>
      {state === "error" && (
        <span role="alert" className="self-center text-sm text-red-700">
          {t.error}
        </span>
      )}
    </div>
  );

  const form =
    serverEmail && open ? (
      <form onSubmit={sendNow} className="mt-3 flex flex-col gap-2 rounded-xl border border-teal-200 bg-teal-50/60 p-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            required
            autoComplete="email"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              if (send.s === "error") setSend({ s: "idle" });
            }}
            placeholder={t.emailPlaceholder}
            aria-label={t.emailPlaceholder}
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm"
          />
          <button
            disabled={send.s === "sending"}
            className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {send.s === "sending" ? t.sending : t.send}
          </button>
        </div>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.target.checked)} className="mt-0.5" />
          {t.updates}
        </label>
        {send.s === "sent" && <p className="text-sm font-medium text-teal-800">{t.sent(send.to)}</p>}
        {send.s === "error" && (
          <p role="alert" className="text-sm text-red-700">
            {t.errors[send.code] ?? t.errors.emailFailed}
          </p>
        )}
        <p className="text-xs text-stone-500">{t.privacy}</p>
      </form>
    ) : null;

  const subscribed =
    serverEmail && pref?.updates && !open ? (
      <p className="mt-2 text-xs text-stone-600">
        {t.updatesOn(pref.to)}{" "}
        <button onClick={stop} className="underline hover:text-stone-900">
          {t.stop}
        </button>
      </p>
    ) : null;

  if (compact)
    return (
      <div>
        {buttons}
        {form}
        {subscribed}
      </div>
    );

  return (
    <section className="no-print rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium">{t.title}</h2>
          <p className="text-sm text-stone-600">{t.body}</p>
        </div>
        {buttons}
      </div>
      {form}
      {subscribed}
    </section>
  );
}
