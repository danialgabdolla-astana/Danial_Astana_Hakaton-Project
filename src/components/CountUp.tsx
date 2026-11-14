"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/money";

/** Counts a dollar amount up from $0 (~800 ms). Shows the final amount right away for reduced motion. */
export function CountUp({ value, durationMs = 800 }: { value: number; durationMs?: number }) {
  const [shown, setShown] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? value : 0,
  );

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(t < 1 ? Math.round(value * eased) : value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  // Screen readers get the final amount, not every step.
  return (
    <>
      <span aria-hidden className="tabular-nums">
        {formatUsd(shown)}
      </span>
      <span className="sr-only">{formatUsd(value)}</span>
    </>
  );
}
