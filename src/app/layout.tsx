import type { Metadata, Viewport } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const TITLE = "BillCheck — check your medical bill against your EOB";
const DESCRIPTION =
  "Upload your medical bill and your insurer's EOB. BillCheck finds what you can dispute and gives you a ready-to-send letter, a phone script and deadlines. $20 per bill at launch.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mybillcheck.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "BillCheck",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "BillCheck result: You may be overcharged $645" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.png"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f766e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
