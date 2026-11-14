"use client";

import { useState } from "react";
import { caseLinkFor } from "@/lib/case-link";
import type { Analysis } from "@/lib/schemas";
import { useMessages } from "@/lib/i18n/client";

/**
 * "Save your case" without an account: a private link that carries the whole case in its #fragment.
 * Built on click so it always includes the latest letter and tracker status.
 */
export function CaseLink({ analysis, compact = false }: { analysis: Analysis; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const t = useMessages().caseLink;

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

  if (compact) return buttons;

  return (
    <section className="no-print flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-medium">{t.title}</h2>
        <p className="text-sm text-stone-600">{t.body}</p>
      </div>
      {buttons}
    </section>
  );
}
