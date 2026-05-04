"use client";

import React, { useState, type ReactNode } from "react";
import {
  WalletConnect,
  AssetBalance,
  PaymentConfirmation,
  TransactionStatus,
  SingleUseWallet,
  EnterprisePayFlow,
} from "@stellar-pay/ui";
import type {
  BatchDisbursementConfig,
  StellarAsset,
  DisbursementStatus,
} from "@stellar-pay/ui";

// ─── Demo data for EnterprisePayFlow ─────────────────────────────────────────

const USDC: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

const DEMO_BATCH: BatchDisbursementConfig = {
  signerPublicKey: "GBZXMKPINQLDCJ7PNRKTCZGZKTQOFRFLHZ5DBVKZRFQPVIXM7QAWQCA",
  delayBetweenMs: 600,
  recipients: [
    {
      id: "R-001",
      name: "Alice Nwosu",
      destination: "GBZXMKPINQLDCJ7PNRKTCZGZKTQOFRFLHZ5DBVKZRFQPVIXM7QAWQCA",
      asset: USDC,
      amount: "500",
    },
    {
      id: "R-002",
      name: "James Obi",
      destination: "GBZXMKPINQLDCJ7PNRKTCZGZKTQOFRFLHZ5DBVKZRFQPVIXM7QAWQCA",
      asset: USDC,
      amount: "1200",
    },
    {
      id: "R-003",
      name: "Fatima Hassan",
      destination: "GBZXMKPINQLDCJ7PNRKTCZGZKTQOFRFLHZ5DBVKZRFQPVIXM7QAWQCA",
      asset: USDC,
      amount: "750",
    },
    {
      id: "R-004",
      name: "Emmanuel Dike",
      destination: "GBZXMKPINQLDCJ7PNRKTCZGZKTQOFRFLHZ5DBVKZRFQPVIXM7QAWQCA",
      asset: USDC,
      amount: "300",
    },
  ],
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────

interface CardProps {
  title: string;
  subtitle?: string;
  tag?: string;
  children: ReactNode;
  delay?: number;
}

function Card({ title, subtitle, tag, children, delay = 0 }: CardProps) {
  return (
    <div
      style={{
        background: "#0a1520",
        border: "1px solid #1e3a55",
        borderRadius: 14,
        overflow: "hidden",
        animation: `fadeSlideUp 0.5s ease ${delay}s both`,
      }}
    >
      {/* Shimmer accent bar */}
      <div style={{ height: 3, position: "relative", overflow: "hidden" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, #8dc8e040 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.5s linear infinite",
          }}
        />
      </div>

      {/* Header */}
      <div style={{ padding: "18px 20px 6px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "#e8f4fb",
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p style={{ color: "#4a7a9b", fontSize: 11, marginTop: 2 }}>
                {subtitle}
              </p>
            )}
          </div>
          {tag && (
            <span
              style={{
                display: "inline-block",
                padding: "1px 7px",
                background: "#0f1f2e",
                border: "1px solid #1e3a55",
                color: "#4a7a9b",
                fontSize: 10,
                fontFamily: "'Space Mono', monospace",
                borderRadius: 3,
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              {tag}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 20px 20px" }}>{children}</div>
    </div>
  );
}

// ─── Demo TransactionStatus ───────────────────────────────────────────────────

import type { TransactionStep, TransactionStatus as TxStatus } from "@stellar-pay/ui";

const DEMO_STEPS: Array<{ id: string; label: string }> = [
  { id: "build", label: "Building Transaction" },
  { id: "sign", label: "Signing" },
  { id: "submit", label: "Submitting" },
  { id: "confirm", label: "Confirmed" },
];

function initSteps(): TransactionStep[] {
  return DEMO_STEPS.map((s) => ({ ...s, status: "waiting" }));
}

function TxStatusDemo() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<TransactionStep[]>(initSteps());
  const [status, setStatus] = useState<TxStatus>("idle");

  const simulate = () => {
    const fresh = initSteps();
    setSteps(fresh);
    setStep(0);
    setRunning(true);
    setStatus("building");

    let i = 0;
    const statuses: TxStatus[] = ["building", "signing", "submitting", "success"];

    const tick = () => {
      if (i >= DEMO_STEPS.length) {
        setRunning(false);
        return;
      }
      const cur = i;
      setStatus(statuses[cur]);
      setSteps((prev) =>
        prev.map((s, idx) => {
          if (idx < cur) return { ...s, status: "done", ledger: 142857 + idx };
          if (idx === cur) return { ...s, status: "active" };
          return { ...s, status: "waiting" };
        })
      );
      i++;
      setTimeout(tick, 900);
    };
    tick();
  };

  const demoResult =
    status === "success"
      ? {
          hash: "9f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
          ledger: 143022,
          createdAt: new Date().toISOString(),
          fee: "100",
          successful: true,
          envelopeXdr: "",
          resultXdr: "",
        }
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {status !== "idle" && (
        <TransactionStatus
          status={status}
          steps={steps}
          result={demoResult}
        />
      )}
      <button
        onClick={simulate}
        disabled={running}
        style={{
          padding: "10px 0",
          background: "linear-gradient(135deg, #8dc8e022, #10d07022)",
          border: "1px solid #8dc8e050",
          borderRadius: 8,
          color: "#b8dff0",
          cursor: running ? "not-allowed" : "pointer",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          opacity: running ? 0.6 : 1,
        }}
      >
        {running ? "Running…" : "▶ Simulate Transaction"}
      </button>
    </div>
  );
}

// ─── Demo AssetBalance (static data — no connected wallet needed) ─────────────

const DEMO_BALANCES = [
  {
    asset: { code: "XLM", issuer: null, name: "Stellar Lumens" },
    balance: "1420.5000000",
    buyingLiabilities: "0.0000000",
    sellingLiabilities: "0.0000000",
  },
  {
    asset: {
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    },
    balance: "5000.0000000",
    limit: "10000.0000000",
  },
  {
    asset: {
      code: "yXLM",
      issuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
    },
    balance: "830.0000000",
    limit: "5000.0000000",
  },
  {
    asset: {
      code: "AQUA",
      issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    },
    balance: "44000.0000000",
    limit: "100000.0000000",
  },
];

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function ComponentGrid() {
  return (
    <section aria-label="Component demos">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 16,
        }}
      >
        <Card
          title="WalletConnect"
          subtitle="Freighter · Albedo · xBull"
          tag="wallet"
          delay={0.05}
        >
          <WalletConnect />
        </Card>

        <Card
          title="TransactionStatus"
          subtitle="Real-time ledger tracker"
          tag="tx"
          delay={0.1}
        >
          <TxStatusDemo />
        </Card>

        <Card
          title="AssetBalance"
          subtitle="Multi-asset trustline display"
          tag="assets"
          delay={0.15}
        >
          <AssetBalance
            balances={DEMO_BALANCES}
            onAction={(action, asset) =>
              console.log(`[stellar-pay-ui] ${action}`, asset)
            }
          />
        </Card>

        <Card
          title="PaymentConfirmation"
          subtitle="Sign & broadcast flow"
          tag="payment"
          delay={0.2}
        >
          <PaymentConfirmation
            defaultDestination="GBZXMKPINQLDCJ7PNRKTCZGZKTQOFRFLHZ5DBVKZRFQPVIXM7QAWQCA"
            onSuccess={(hash) => console.log("[stellar-pay-ui] TX:", hash)}
          />
        </Card>

        <Card
          title="SingleUseWallet"
          subtitle="SDP on-demand wallet generation"
          tag="sdp"
          delay={0.25}
        >
          <SingleUseWallet
            defaultConfig={{ purpose: "invoice-1042", expiresInSeconds: 1800 }}
            onGenerate={(pk) => console.log("[stellar-pay-ui] Generated:", pk)}
          />
        </Card>

        <Card
          title="EnterprisePayFlow"
          subtitle="Batch disbursement engine"
          tag="enterprise"
          delay={0.3}
        >
          <EnterprisePayFlow
            config={DEMO_BATCH}
            onComplete={(results) =>
              console.log("[stellar-pay-ui] Batch done:", results)
            }
          />
        </Card>
      </div>
    </section>
  );
}
