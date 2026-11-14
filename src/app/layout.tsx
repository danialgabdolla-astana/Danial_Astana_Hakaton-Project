import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BillCheck — check your medical bill against your EOB",
  description:
    "Upload your medical bill and your insurer's EOB. BillCheck finds what you can dispute and gives you a ready-to-send letter, a phone script and deadlines. $19 per bill.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f766e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="no-print border-b border-stone-200 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Main">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white">
                ✓
              </span>
              BillCheck
            </Link>
            <div className="flex items-center gap-1 text-sm sm:gap-4">
              <Link href="/tracker" className="rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-100">
                My disputes
              </Link>
              <Link href="/check" className="rounded-lg bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-800">
                Check a bill
              </Link>
            </div>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="no-print border-t border-stone-200 bg-white py-8 text-sm text-stone-600">
          <div className="mx-auto max-w-6xl space-y-2 px-4 sm:px-6">
            <p>
              <strong>BillCheck is not a law firm or medical provider. Not legal or medical advice.</strong> We help you read your
              documents and ask the right questions.
            </p>
            <p>
              Know your rights:{" "}
              <a className="underline" href="https://www.cms.gov/medical-bill-rights" target="_blank" rel="noreferrer">
                CMS — medical bill rights
              </a>{" "}
              ·{" "}
              <a className="underline" href="https://www.cms.gov/nosurprises" target="_blank" rel="noreferrer">
                No Surprises Act
              </a>
            </p>
            <p className="text-stone-500">Business Cup 2.0 project. Sample documents are fictional.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
