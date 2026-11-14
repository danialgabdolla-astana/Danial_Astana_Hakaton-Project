import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { OpenCase } from "@/components/OpenCase";

export const metadata: Metadata = { title: "Open your case — BillCheck", robots: { index: false } };

export default function OpenPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <ClientOnly fallback={<p className="text-stone-600">Opening your case…</p>}>
        <OpenCase />
      </ClientOnly>
    </main>
  );
}
