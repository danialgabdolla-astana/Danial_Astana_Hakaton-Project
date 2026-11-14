import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { TrackerBoard } from "@/components/TrackerBoard";

export const metadata: Metadata = { title: "My disputes — BillCheck" };

export default function TrackerPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">My disputes</h1>
      <p className="mt-2 text-stone-600">
        Billing disputes usually take a few calls over several weeks. Keep every call, reference number and follow-up date in one place.
      </p>
      <div className="mt-8">
        <ClientOnly fallback={<p className="text-stone-500">Loading…</p>}>
          <TrackerBoard />
        </ClientOnly>
      </div>
    </main>
  );
}
