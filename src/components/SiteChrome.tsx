"use client";

import Link from "next/link";
import { LOCALES, MESSAGES, type Locale } from "@/lib/i18n";
import { REPO_URL } from "@/lib/links";
import { setLocale, useHtmlLang, useLocale, useMessages } from "@/lib/i18n/client";

const SHORT: Record<Locale, string> = { en: "EN", es: "ES", fr: "FR" };

/** Language picker: a native <select>, so it works with keyboard, screen readers and on phones. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const m = useMessages();
  useHtmlLang();
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{m.common.language}</span>
      <span aria-hidden className="pointer-events-none absolute left-2 text-stone-500">
        🌐
      </span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="appearance-none rounded-lg border border-stone-300 bg-white py-2 pl-7 pr-2 text-sm text-stone-700 hover:bg-stone-50"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {SHORT[l]} · {MESSAGES[l].langName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SiteHeader() {
  const m = useMessages();
  return (
    <header className="no-print border-b border-stone-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white">
            ✓
          </span>
          <span className="hidden min-[400px]:inline">BillCheck</span>
        </Link>
        <div className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/tracker" className="rounded-lg px-2 py-2 text-stone-700 hover:bg-stone-100 sm:px-3">
            {m.common.myDisputes}
          </Link>
          <Link href="/check" className="hidden rounded-lg bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-800 sm:inline-block">
            {m.common.checkABill}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const m = useMessages();
  return (
    <footer className="no-print border-t border-stone-200 bg-white py-8 text-sm text-stone-600">
      <div className="mx-auto max-w-6xl space-y-2 px-4 sm:px-6">
        <p>
          <strong>{m.footer.disclaimerStrong}</strong> {m.footer.disclaimerRest}
        </p>
        <p>
          {m.footer.knowRights}{" "}
          <a className="underline" href="https://www.cms.gov/medical-bill-rights" target="_blank" rel="noreferrer">
            {m.footer.cmsRights}
          </a>{" "}
          ·{" "}
          <a className="underline" href="https://www.cms.gov/nosurprises" target="_blank" rel="noreferrer">
            {m.footer.nsa}
          </a>
        </p>
        <p className="text-stone-500">
          {m.footer.project} ·{" "}
          <a className="underline" href={REPO_URL} target="_blank" rel="noreferrer">
            {m.footer.github}
          </a>
        </p>
      </div>
    </footer>
  );
}

/** Small client-side text pieces for server pages. */
export function Loading({ className = "p-10 text-center text-stone-500" }: { className?: string }) {
  const m = useMessages();
  return <p className={className}>{m.common.loading}</p>;
}
