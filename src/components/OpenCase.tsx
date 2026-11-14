"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decodeCase, importCase } from "@/lib/case-link";

/** Reads a private case link (/open#…), saves the case in this browser and shows the results. */
export function OpenCase() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    decodeCase(window.location.hash)
      .then(importCase)
      .then((id) => {
        if (!cancelled) router.replace(`/results?id=${id}`);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!error) {
    return (
      <p role="status" className="text-stone-600">
        Opening your case…
      </p>
    );
  }
  return (
    <div role="alert">
      <h1 className="text-2xl font-semibold">We couldn&apos;t open that case</h1>
      <p className="mt-2 text-stone-600">{error}</p>
      <Link href="/check" className="mt-6 inline-block rounded-xl bg-teal-700 px-5 py-3 font-medium text-white">
        Check a bill
      </Link>
    </div>
  );
}
