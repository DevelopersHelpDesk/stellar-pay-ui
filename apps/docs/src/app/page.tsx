"use client";

import { StellarPayProvider } from "@stellar-pay/ui";
import { HeroSection } from "../components/HeroSection";
import { InstallBanner } from "../components/InstallBanner";
import { ComponentGrid } from "../components/ComponentGrid";
import { UsageSection } from "../components/UsageSection";
import { FooterBanner } from "../components/FooterBanner";

export default function Home() {
  return (
    <StellarPayProvider network="testnet">
      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 20px 80px",
        }}
      >
        <HeroSection />
        <div style={{ height: 28 }} />
        <InstallBanner />
        <div style={{ height: 20 }} />
        <ComponentGrid />
        <div style={{ height: 28 }} />
        <UsageSection />
        <div style={{ height: 20 }} />
        <FooterBanner />
      </main>
    </StellarPayProvider>
  );
}
