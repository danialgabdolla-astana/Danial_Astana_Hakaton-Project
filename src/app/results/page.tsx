import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { ResultsView } from "@/components/ResultsView";
import { Loading } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Your results — BillCheck" };

export default function ResultsPage() {
  return (
    <ClientOnly fallback={<Loading />}>
      <ResultsView />
    </ClientOnly>
  );
}
