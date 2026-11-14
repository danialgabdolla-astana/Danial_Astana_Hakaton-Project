"use client";

import { useMessages } from "@/lib/i18n/client";

/** Title and intro of the server-rendered pages, in the user's language. */
export function PageIntro({ page }: { page: "check" | "tracker" }) {
  const m = useMessages();
  const { title, lede } = m[page];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">{lede}</p>
    </>
  );
}
