import type { Metadata } from "next";
import { Uploader } from "@/components/Uploader";

export const metadata: Metadata = { title: "Check your bill — BillCheck" };

export default function CheckPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Check your bill against your EOB</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Add both documents. We read every line, match the bill to what your insurer processed, and show you exactly what to question —
        free. No sign-up.
      </p>
      <div className="mt-8">
        <Uploader />
      </div>
    </main>
  );
}
