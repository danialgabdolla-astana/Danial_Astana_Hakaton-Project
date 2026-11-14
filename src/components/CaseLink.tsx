"use client";

import { useState } from "react";
import { caseLinkFor } from "@/lib/case-link";
import type { Analysis } from "@/lib/schemas";

/**
 * "Save your case" without an account: a private link that carries the whole case in its #fragment.
 * Built on click so it always includes the latest letter and tracker status.
 */
export function CaseLink({ analysis, compact = false }: { analysis: Analysis; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

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
      const subject = `My BillCheck case: ${analysis.bill.providerName}`;
      const body =
        `Open my BillCheck case (results, letter and tracker) on any device:\n\n${url}\n\n` +
        "Keep this link private: anyone with it can see this case. BillCheck doesn't store it.";
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch {
      setState("error");
    }
  }

  const buttons = (
    <div className="flex flex-wrap gap-2">
      <button onClick={copy} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">
        {state === "copied" ? "Link copied ✓" : "Copy private link"}
      </button>
      <button onClick={email} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100">
        Email it to myself
      </button>
      {state === "error" && (
        <span role="alert" className="self-center text-sm text-red-700">
          Couldn&apos;t make the link in this browser.
        </span>
      )}
    </div>
  );

  if (compact) return buttons;

  return (
    <section className="no-print flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-medium">Save your case — no account needed</h2>
        <p className="text-sm text-stone-600">
          Your case lives in this browser. A private link opens it on any device. The case data stays in the link itself, never on our server.
        </p>
      </div>
      {buttons}
    </section>
  );
}
