"use client";

import React, { useState } from "react";

const SNIPPETS: Record<string, string> = {
  "Quick Start": `import { StellarPayProvider, WalletConnect } from "@stellar-pay/ui";

export default function App() {
  return (
    <StellarPayProvider network="mainnet">
      <WalletConnect
        onConnect={(publicKey) => console.log("Connected:", publicKey)}
      />
    </StellarPayProvider>
  );
}`,

  "Send Payment": `import {
  StellarPayProvider,
  PaymentConfirmation,
} from "@stellar-pay/ui";

const USDC = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

export default function PayPage() {
  return (
    <StellarPayProvider network="mainnet">
      <PaymentConfirmation
        assets={[USDC]}
        defaultDestination="GBZX...WQCA"
        onSuccess={(hash) => toast.success(\`Confirmed: \${hash}\`)}
        onError={(err) => toast.error(err)}
      />
    </StellarPayProvider>
  );
}`,

  "Use Hooks": `import {
  useStellarWallet,
  useTransaction,
  useAssetBalances,
} from "@stellar-pay/ui";

function Dashboard() {
  const { publicKey, connect } = useStellarWallet();
  const { balances, loading } = useAssetBalances();
  const { sendPayment, status } = useTransaction();

  return (
    <div>
      {!publicKey && (
        <button onClick={() => connect("freighter")}>
          Connect Freighter
        </button>
      )}
      {balances.map((b) => (
        <div key={b.asset.code}>
          {b.asset.code}: {b.balance}
        </div>
      ))}
    </div>
  );
}`,

  "SDP Batch": `import { StellarPayProvider, EnterprisePayFlow } from "@stellar-pay/ui";

const USDC = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

export default function DisbursePage() {
  const batchConfig = {
    signerPublicKey: process.env.SIGNER_PUBLIC_KEY,
    delayBetweenMs: 500,
    recipients: [
      { id: "R-001", destination: "GBZX...", asset: USDC, amount: "500" },
      { id: "R-002", destination: "GABC...", asset: USDC, amount: "250" },
    ],
  };

  return (
    <StellarPayProvider network="mainnet">
      <EnterprisePayFlow
        config={batchConfig}
        onComplete={(results) => {
          const confirmed = results.filter(r => r.status === "confirmed");
          console.log(\`\${confirmed.length} payments confirmed\`);
        }}
      />
    </StellarPayProvider>
  );
}`,
};

export function UsageSection() {
  const tabs = Object.keys(SNIPPETS);
  const [active, setActive] = useState(tabs[0]);

  return (
    <section>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 18,
          color: "#e8f4fb",
          marginBottom: 16,
        }}
      >
        Usage
      </h2>

      <div
        style={{
          background: "#050d14",
          border: "1px solid #1e3a55",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #1e3a55",
            padding: "0 16px",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === active ? "#8dc8e0" : "transparent"}`,
                color: tab === active ? "#8dc8e0" : "#4a7a9b",
                fontSize: 12,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.2s",
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Code */}
        <pre
          style={{
            padding: "20px 22px",
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: "#6ba3c0",
            lineHeight: 1.8,
            overflowX: "auto",
            whiteSpace: "pre",
            margin: 0,
          }}
        >
          {SNIPPETS[active]}
        </pre>
      </div>
    </section>
  );
}
