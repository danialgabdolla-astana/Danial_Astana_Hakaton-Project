import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
import { Uploader } from "@/components/Uploader";

export const metadata: Metadata = { title: "Check your bill — BillCheck" };

export default function CheckPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageIntro page="check" />
      <div className="mt-8">
        <Uploader />
      </div>
    </main>
  );
}
