"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaseLinkError, decodeCase, importCase } from "@/lib/case-link";
import { useMessages } from "@/lib/i18n/client";

/** Reads a private case link (/open#…), saves the case in this browser and shows the results. */
export function OpenCase() {
  const router = useRouter();
  const t = useMessages().open;
  const checkABill = useMessages().common.checkABill;
  const [error, setError] = useState<"damaged" | "notCase" | null>(null);

  useEffect(() => {
    let cancelled = false;
    decodeCase(window.location.hash)
      .then(importCase)
      .then((id) => {
        if (!cancelled) router.replace(`/results?id=${id}`);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof CaseLinkError ? e.code : "damaged");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!error) {
    return (
      <p role="status" className="text-stone-600">
        {t.opening}
      </p>
    );
  }
  return (
    <div role="alert">
      <h1 className="text-2xl font-semibold">{t.failTitle}</h1>
      <p className="mt-2 text-stone-600">{t[error]}</p>
      <Link href="/check" className="mt-6 inline-block rounded-xl bg-teal-700 px-5 py-3 font-medium text-white">
        {checkABill}
      </Link>
    </div>
  );
}

/** Server-rendered placeholder while the case opens. */
export function OpeningText() {
  return <p className="text-stone-600">{useMessages().open.opening}</p>;
}
