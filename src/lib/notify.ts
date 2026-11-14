"use client";

import { caseLinkFor } from "./case-link";
import { store } from "./client-store";
import type { Locale } from "./i18n";
import type { Analysis } from "./schemas";
import { getDisputes } from "./tracker";

/**
 * Case emails from the browser's side. The address is kept only in this browser (localStorage), and
 * only after the user typed it and asked for an email. Updates (letter sent, status changes) go to that
 * address while "email me updates" is on.
 */
const KEY = "bc:email";
type Pref = { to: string; updates: boolean };

export function getEmailPref(): Pref | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v && typeof v.to === "string" ? { to: v.to, updates: v.updates !== false } : null;
  } catch {
    return null;
  }
}

export function setEmailPref(p: Pref | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage disabled */
  }
}

let enabled: Promise<boolean> | null = null;
/** Whether the server can send email (otherwise the page offers the user's own mail app). */
export function emailEnabled(): Promise<boolean> {
  enabled ??= fetch("/api/email")
    .then((r) => r.json())
    .then((j) => !!j.enabled)
    .catch(() => false);
  return enabled;
}

export type EmailKind = "case" | "letterSent" | "status";

/** Sends one case email now. Resolves to the API's error code, or null on success. */
export async function sendCaseEmail(to: string, kind: EmailKind, analysis: Analysis, locale: Locale): Promise<string | null> {
  const d = getDisputes().find((x) => x.id === analysis.analysisId);
  const body = {
    to,
    kind,
    locale,
    provider: analysis.bill.providerName,
    billBalance: d?.billBalance ?? analysis.summary.billBalance,
    disputable: d?.disputable ?? analysis.summary.disputableTotal,
    status: kind === "case" ? undefined : d?.status,
    followUpDate: kind === "case" ? undefined : d?.followUpDate,
    caseUrl: await caseLinkFor(analysis),
  };
  try {
    const res = await fetch("/api/email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return null;
    const j = await res.json().catch(() => ({}));
    return (j?.code as string) || "emailFailed";
  } catch {
    return "emailFailed";
  }
}

/** Fire-and-forget update after the user changes their case, if they opted in. */
export function notifyUpdate(analysisId: string, kind: "letterSent" | "status", locale: Locale) {
  const pref = getEmailPref();
  const analysis = store.getAnalysis(analysisId);
  if (!pref?.updates || !analysis) return;
  void emailEnabled().then((on) => {
    if (on) void sendCaseEmail(pref.to, kind, analysis, locale).catch(() => {});
  });
}
