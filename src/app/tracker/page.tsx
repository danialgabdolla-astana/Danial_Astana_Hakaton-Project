import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { PageIntro } from "@/components/PageIntro";
import { Loading } from "@/components/SiteChrome";
import { TrackerBoard } from "@/components/TrackerBoard";

export const metadata: Metadata = { title: "My disputes — BillCheck" };

export default function TrackerPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageIntro page="tracker" />
      <div className="mt-8">
        <ClientOnly fallback={<Loading className="text-stone-500" />}>
          <TrackerBoard />
        </ClientOnly>
      </div>
    </main>
  );
}
