import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { ResultsView } from "@/components/ResultsView";

export const metadata: Metadata = { title: "Your results — BillCheck" };

export default function ResultsPage() {
  return (
    <ClientOnly fallback={<p className="p-10 text-center text-stone-500">Loading…</p>}>
      <ResultsView />
    </ClientOnly>
  );
}
