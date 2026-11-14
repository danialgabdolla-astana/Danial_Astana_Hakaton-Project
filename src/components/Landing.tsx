"use client";

import Link from "next/link";
import { useMessages } from "@/lib/i18n/client";

export function Landing() {
  const m = useMessages();
  const L = m.landing;
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_440px]">
        <div>
        <p className="mb-4 inline-block rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">{L.badge}</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{L.h1}</h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">{L.lede}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/check" className="rounded-xl bg-teal-700 px-6 py-3.5 text-center text-lg font-semibold text-white shadow-sm hover:bg-teal-800">
            {L.ctaCheck}
          </Link>
          <Link href="/check?sample=1" className="rounded-xl bg-stone-900 px-6 py-3.5 text-center text-lg font-semibold text-white shadow-sm hover:bg-stone-800">
            ▶ {L.ctaSample}
          </Link>
        </div>
        <p className="mt-3 text-sm text-stone-600">
          {L.orTry}{" "}
          <Link href="/check?sample=2" className="font-medium text-teal-800 underline underline-offset-2">
            {L.anesthesiaLink}
          </Link>{" "}
          {L.anesthesiaNote}
        </p>
        <p className="mt-4 text-sm text-stone-500">{L.trust}</p>
        </div>
        <HeroPreview />
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {L.stats.map((s) => (
            <div key={s.s + s.n}>
              <div className="text-4xl font-semibold text-teal-800">{s.n}</div>
              <p className="mt-2 text-stone-700">{s.t}</p>
              <p className="mt-1 text-xs text-stone-500">{s.s}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-10 text-sm text-stone-600 sm:px-6">{L.deductibleNote}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-semibold">
          {L.howTitle}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {L.steps.map(([t, d], i) => (
            <li key={i} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 text-sm font-semibold text-white">{i + 1}</div>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-stone-600">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-2xl bg-stone-900 p-6 text-stone-200">
          <p className="font-medium text-white">{L.aiTitle}</p>
          <p className="mt-1 text-sm">{L.aiBody}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="vs-chat">
        <h2 id="vs-chat" className="text-2xl font-semibold">
          {L.vsTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-stone-600">{L.vsLede}</p>
        {/* Narrow screens: one card per row, so the BillCheck column is never cut off. */}
        <ul className="mt-6 space-y-3 sm:hidden">
          {L.vsRows.map(([what, chat, us]) => (
            <li key={what} className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
              <p className="font-medium">{what}</p>
              <p className="mt-2 text-stone-600">
                <span className="font-medium">{L.vsChatShort}:</span> {chat}
              </p>
              <p className="mt-1 text-teal-900">
                <span className="font-medium">{L.vsUs}:</span> ✓ {us}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-stone-200 bg-white sm:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500">
                <th className="px-4 py-3 font-medium" scope="col"></th>
                <th className="px-4 py-3 font-medium" scope="col">
                  {L.vsChat}
                </th>
                <th className="px-4 py-3 font-medium text-teal-900" scope="col">
                  {L.vsUs}
                </th>
              </tr>
            </thead>
            <tbody>
              {L.vsRows.map(([what, chat, us]) => (
                <tr key={what} className="border-t border-stone-200">
                  <th scope="row" className="px-4 py-3 font-medium">
                    {what}
                  </th>
                  <td className="px-4 py-3 text-stone-600">{chat}</td>
                  <td className="px-4 py-3 text-teal-900">✓ {us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white" aria-labelledby="pricing">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="pricing" className="text-2xl font-semibold">
            {L.pricingTitle}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Price {...L.plans.free} cta={L.ctaFree} />
            <Price {...L.plans.single} cta={L.ctaFree} highlight />
            <Price {...L.plans.family} cta={L.ctaFamily} />
          </div>
          <h3 className="mt-12 font-semibold">{L.compareTitle}</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-stone-500">
                <tr>
                  {L.compareCols.map((c, i) => (
                    <th key={c} className={`py-2 font-medium ${i < 2 ? "pr-4" : ""}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {L.compareRows.map(([a, b, c]) => (
                  <tr key={a} className="border-t border-stone-200">
                    <td className="py-2 pr-4">{a}</td>
                    <td className="py-2 pr-4 text-stone-600">{b}</td>
                    <td className="py-2">{c}</td>
                  </tr>
                ))}
                <tr className="border-t border-stone-200 font-medium text-teal-900">
                  <td className="py-2 pr-4">{L.compareUs[0]}</td>
                  <td className="py-2 pr-4">{L.compareUs[1]}</td>
                  <td className="py-2">{L.compareUs[2]}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-semibold">
          {L.faqTitle}
        </h2>
        <div className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {L.faq.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="mr-2 text-teal-700 group-open:hidden">+</span>
                <span className="mr-2 hidden text-teal-700 group-open:inline">−</span>
                {f.q}
              </summary>
              <p className="mt-2 text-stone-600">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/check?sample=1" className="rounded-xl bg-teal-700 px-6 py-3.5 text-lg font-semibold text-white hover:bg-teal-800">
            {L.ctaBottom}
          </Link>
        </div>
      </section>
    </main>
  );
}

function Price({ name, price, note, items, highlight, cta }: { name: string; price: string; note?: string; items: string[]; highlight?: boolean; cta: string }) {
  return (
    <div className={`flex flex-col rounded-2xl border p-6 ${highlight ? "border-teal-600 ring-2 ring-teal-600/20" : "border-stone-200"}`}>
      <div className="font-medium">{name}</div>
      <div className="mt-2 text-4xl font-semibold">
        {price}
        {note && <span className="ml-1 text-base font-normal text-stone-500">{note}</span>}
      </div>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-stone-700">
        {items.map((i) => (
          <li key={i}>✓ {i}</li>
        ))}
      </ul>
      <Link
        href="/check"
        className={`mt-6 rounded-xl px-4 py-2.5 text-center font-semibold ${highlight ? "bg-teal-700 text-white hover:bg-teal-800" : "border border-teal-700 text-teal-900 hover:bg-teal-50"}`}
      >
        {cta}
      </Link>
    </div>
  );
}

/** A static picture of what the results look like, built from the ER sample case (not a live result). */
function HeroPreview() {
  const m = useMessages();
  const rows: { desc: string; amount: string; tag?: string; cls: string }[] = [
    { desc: "Emergency dept visit, level 4", amount: "$1,450.00", cls: "" },
    { desc: "CT head/brain w/o contrast", amount: "$2,100.00", tag: m.sbs.short.DUPLICATE_CHARGE, cls: "bg-red-50" },
    { desc: "Supplies and materials", amount: "$165.00", tag: m.sbs.short.LINE_NOT_ON_EOB, cls: "bg-amber-50" },
  ];
  return (
    <Link href="/check?sample=1" aria-label={m.landing.ctaSample} className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md lg:block">
      <div className="bg-stone-900 p-5 text-white">
        <p className="text-xs uppercase tracking-wider text-teal-300">
          {m.landing.previewLabel} · Riverside General Hospital
        </p>
        <p className="mt-1 text-2xl font-semibold">
          {m.results.overcharged} <span className="text-teal-300">$645</span>
        </p>
        <p className="mt-1 text-sm text-stone-300">{m.landing.previewSub}</p>
      </div>
      <ul className="text-sm">
        {rows.map((r) => (
          <li key={r.desc} className={`flex items-center justify-between gap-3 border-t border-stone-100 px-5 py-3 ${r.cls}`}>
            <span>
              {r.desc}
              {r.tag && <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-stone-300">{r.tag}</span>}
            </span>
            <span className="tabular-nums">{r.amount}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
