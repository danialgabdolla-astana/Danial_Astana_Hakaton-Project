"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, MESSAGES, isLocale, type Locale, type Messages } from "./index";

/**
 * The chosen language lives in this browser (localStorage), like everything else in BillCheck.
 * Pages are prerendered in English; after hydration they re-render in the saved language.
 */
const KEY = "bc:locale";
const EVENT = "bc:locale-change";
let memory: Locale | null = null; // used when localStorage is unavailable

function read(): Locale {
  try {
    const v = localStorage.getItem(KEY);
    return isLocale(v) ? v : (memory ?? DEFAULT_LOCALE);
  } catch {
    return memory ?? DEFAULT_LOCALE;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_LOCALE);
}

export function useMessages(): Messages {
  return MESSAGES[useLocale()];
}

export function setLocale(locale: Locale) {
  memory = locale;
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* storage disabled: the choice lasts until reload */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Keeps <html lang> in step with the chosen language (screen readers, hyphenation, translation prompts). */
export function useHtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
