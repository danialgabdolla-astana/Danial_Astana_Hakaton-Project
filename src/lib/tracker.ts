"use client";

import { store } from "./client-store";
import type { Analysis } from "./schemas";

export const STATUSES = ["Not started", "Letter sent", "Called", "Waiting", "Resolved"] as const;
export type Status = (typeof STATUSES)[number];

export type CallLog = { id: string; date: string; who: string; ref: string; notes: string };

export type Dispute = {
  id: string; // analysisId
  provider: string;
  billBalance: number;
  disputable: number;
  status: Status;
  createdAt: string;
  letterSentAt: string | null;
  followUpDate: string; // YYYY-MM-DD
  amountSaved: number;
  calls: CallLog[];
};

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function getDisputes(): Dispute[] {
  return store.getDisputes<Dispute>();
}

export function saveDisputes(list: Dispute[]) {
  store.saveDisputes(list);
}

/** Adds the bill to the tracker once (idempotent). The ER demo case arrives with a little history. */
export function ensureDispute(a: Analysis): Dispute {
  const list = getDisputes();
  const existing = list.find((d) => d.id === a.analysisId);
  if (existing) return existing;
  const d: Dispute = a.sample === "er" ? demoDispute(a) : {
    id: a.analysisId,
    provider: a.bill.providerName,
    billBalance: a.summary.billBalance,
    disputable: a.summary.disputableTotal,
    status: "Not started",
    createdAt: today(),
    letterSentAt: null,
    followUpDate: addDays(today(), 30),
    amountSaved: 0,
    calls: [],
  };
  saveDisputes([d, ...list]);
  return d;
}

export function isDisputeList(x: unknown): x is Dispute[] {
  return Array.isArray(x) && x.every((d) => d && typeof d === "object" && "id" in d && "provider" in d && "status" in d && Array.isArray((d as Dispute).calls));
}

/** A demo dispute a few days in: letter sent, one call logged with a reference number, follow-up booked. */
export function demoDispute(a: Analysis): Dispute {
  const t = today();
  return {
    id: a.analysisId,
    provider: a.bill.providerName,
    billBalance: a.summary.billBalance,
    disputable: a.summary.disputableTotal,
    status: "Called",
    createdAt: addDays(t, -4),
    letterSentAt: addDays(t, -3),
    followUpDate: addDays(t, 10),
    amountSaved: 0,
    calls: [
      {
        id: "demo-call-1",
        date: addDays(t, -1),
        who: "Maria, billing office",
        ref: "RGH-55120",
        notes: "Account on hold for 30 days. They are reviewing the duplicate CT scan and will mail a corrected bill.",
      },
    ],
  };
}
