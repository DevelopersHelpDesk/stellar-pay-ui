import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "stellar-pay-ui — Component Library for Stellar dApps",
  description:
    "Production-grade React components for Stellar Disbursement Platform flows: wallet connect, transaction status, asset balances, and enterprise batch payments.",
  openGraph: {
    title: "stellar-pay-ui",
    description: "React component library for Stellar dApps",
    url: "https://stellar-pay-ui.vercel.app",
    siteName: "stellar-pay-ui",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
