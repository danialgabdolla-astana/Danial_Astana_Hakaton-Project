"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Renders children only in the browser. Pages that read localStorage (results, tracker) use this so their
 * state can be initialized directly from storage without hydration mismatches.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return isClient ? children : fallback;
}
