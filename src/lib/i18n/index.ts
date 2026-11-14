import type { Deadline, Flag } from "../schemas";
import { en, type Messages, type Vars } from "./en";
import { es } from "./es";
import { fr } from "./fr";

export type { Messages, Vars };

export const LOCALES = ["en", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const MESSAGES: Record<Locale, Messages> = { en, es, fr };

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

type RuleText = { title: (p: Vars) => string; explanation: (p: Vars) => string; source: (p: Vars) => string };

/**
 * A flag's title, explanation and source in the user's language. Flags carry `params` from the rules engine;
 * older saved results without them (or English) show the server's English text as is.
 */
export function flagText(flag: Flag, m: Messages): { title: string; explanation: string; source: string } {
  const r = m.rules[flag.ruleId] as RuleText | undefined;
  if (!flag.params || !r || m === en) return { title: flag.title, explanation: flag.explanation, source: flag.source };
  return { title: r.title(flag.params), explanation: r.explanation(flag.params), source: r.source(flag.params) };
}

/** A rule-based deadline in the user's language (falls back to the English text it was created with). */
export function deadlineText(d: Deadline, m: Messages): { title: string; detail: string } {
  const entry = d.key ? (m.deadlines as Record<string, { title: string | ((date: string) => string); detail: string }>)[d.key] : undefined;
  if (!entry) return { title: d.title, detail: d.detail };
  const title = typeof entry.title === "function" ? entry.title(String(d.vars?.date ?? "")) : entry.title;
  return { title, detail: entry.detail };
}

/** An API error body (`{ error, code, vars }`) in the user's language; unknown codes keep the server's English message. */
export function apiErrorText(body: unknown, m: Messages, fallback: string): string {
  const b = (body ?? {}) as { error?: unknown; code?: unknown; vars?: unknown };
  const english = typeof b.error === "string" && b.error ? b.error : fallback;
  const entry = typeof b.code === "string" ? (m.errors as Record<string, string | ((v: Vars) => string)>)[b.code] : undefined;
  if (!entry) return english;
  const text = typeof entry === "function" ? entry((b.vars ?? {}) as Vars) : entry;
  return text || english;
}
