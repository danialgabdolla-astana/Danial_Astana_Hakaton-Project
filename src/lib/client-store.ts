"use client";

import type { Analysis } from "./schemas";

/** Everything is stored in this browser only (no accounts, no database). */
const K = {
  analysis: (id: string) => `bc:analysis:${id}`,
  last: "bc:last",
  unlock: (scope: string) => `bc:unlock:${scope}`,
  pack: (id: string) => `bc:pack:${id}`,
  disputes: "bc:disputes",
};

function get<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function set(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled: the app still works for this session */
  }
}

export const store = {
  saveAnalysis(a: Analysis) {
    set(K.analysis(a.analysisId), a);
    set(K.last, a.analysisId);
  },
  getAnalysis: (id: string) => get<Analysis>(K.analysis(id)),
  lastAnalysisId: () => get<string>(K.last),

  /** Unlock tokens are HMAC-signed by the server; the client just keeps them. */
  saveUnlock(token: string, scope: string) {
    set(K.unlock(scope), token);
  },
  getUnlock(analysisId: string): string | null {
    return get<string>(K.unlock(analysisId)) ?? get<string>(K.unlock("family"));
  },

  savePack: (id: string, pack: unknown) => set(K.pack(id), pack),
  getPack: <T>(id: string) => get<T>(K.pack(id)),

  getDisputes: <T>() => get<T[]>(K.disputes) ?? [],
  saveDisputes: (d: unknown[]) => set(K.disputes, d),
};
