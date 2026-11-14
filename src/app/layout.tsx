import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanceBro — find your down payment in your bank statement",
  description:
    "AI finds forgotten subscriptions, duplicate services and BNPL stacks in your statement and turns them into a dated plan for your first home.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
