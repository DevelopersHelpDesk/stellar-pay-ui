# stellar-pay-ui &nbsp;✦

> **React component library for Stellar dApps** — wallet connect, transaction status, asset balance display, and enterprise disbursements. All wired to the Stellar JS SDK. Think shadcn/ui, but for the Stellar ecosystem.

[![npm](https://img.shields.io/npm/v/@stellar-pay/ui?color=8dc8e0&style=flat-square)](https://npmjs.com/package/@stellar-pay/ui)
[![license](https://img.shields.io/badge/license-MIT-10d070?style=flat-square)](./LICENSE)
[![stellar](https://img.shields.io/badge/stellar-mainnet%20%7C%20testnet-f0b429?style=flat-square)](https://stellar.org)

---

## Why

The Stellar Disbursement Platform (SDP) is adding support for on-demand single-use wallets and enterprise payment flows — but frontend tooling is almost nonexistent in the ecosystem. Most Wave repos build custom UIs from scratch, duplicating the same patterns every time.

`stellar-pay-ui` solves this. It's a composable, tree-shakeable React component library that any Wave maintainer can drop into their project as a peer dependency.

---

## Install

```bash
npm install @stellar-pay/ui stellar-sdk
# or
pnpm add @stellar-pay/ui stellar-sdk
# or
yarn add @stellar-pay/ui stellar-sdk
```

**Peer dependencies:**
- `react >= 18`
- `stellar-sdk >= 12`
- `@stellar-friendbot/freighter-api >= 1.7` *(only if using Freighter)*

---

## Quick Start

```tsx
import { StellarPayProvider, WalletConnect } from "@stellar-pay/ui";

export default function App() {
  return (
    <StellarPayProvider network="mainnet">
      <WalletConnect
        onConnect={(publicKey) => console.log("Connected:", publicKey)}
      />
    </StellarPayProvider>
  );
}
```

---

## Components

### `<StellarPayProvider>`

Wrap your app once. Provides wallet state, Horizon server, and signing context to all child components.

```tsx
<StellarPayProvider network="mainnet">   {/* or "testnet" | "futurenet" */}
  {children}
</StellarPayProvider>
```

---

### `<WalletConnect>`

Wallet picker + connected state. Supports Freighter, Albedo, and xBull.

```tsx
<WalletConnect
  wallets={["freighter", "albedo", "xbull"]}   // default: all three
  onConnect={(publicKey, walletType) => {}}
  onDisconnect={() => {}}
/>
```

---

### `<TransactionStatus>`

Real-time step tracker for a Stellar transaction lifecycle. Pair with `useTransaction`.

```tsx
const { status, steps, result, error } = useTransaction();

<TransactionStatus
  status={status}
  steps={steps}
  result={result}
  error={error}
  explorerBaseUrl="https://stellar.expert/explorer/public/tx"
/>
```

---

### `<AssetBalance>`

Displays all trustline balances for the connected wallet. Fetches automatically via `useAssetBalances`, or supply your own data.

```tsx
// Auto-fetch from connected wallet
<AssetBalance
  onAction={(action, asset) => {
    if (action === "send") openSendModal(asset);
  }}
/>

// Or supply balances manually
<AssetBalance balances={myBalances} showActions={false} />
```

---

### `<PaymentConfirmation>`

3-phase payment flow: form → review → sign & broadcast.

```tsx
<PaymentConfirmation
  defaultDestination="GBZX...WQCA"
  assets={[XLM, USDC]}
  onSuccess={(txHash) => toast.success(`TX: ${txHash}`)}
  onError={(err) => toast.error(err)}
/>
```

---

### `<SingleUseWallet>` *(SDP)*

On-demand keypair generation for single-use payment collection wallets. The secret key is held in React state only — never persisted.

```tsx
<SingleUseWallet
  defaultConfig={{
    purpose: "invoice-1042",
    expiresInSeconds: 1800,      // auto-revokes after 30 min
    expectedAsset: USDC,
  }}
  onGenerate={(publicKey) => shareWithPayer(publicKey)}
  onRevoke={() => markInvoiceClosed()}
/>
```

---

### `<EnterprisePayFlow>` *(SDP)*

Real-time batch disbursement UI. Each recipient gets its own transaction with granular status tracking.

```tsx
<EnterprisePayFlow
  config={{
    signerPublicKey: process.env.NEXT_PUBLIC_SIGNER_KEY,
    delayBetweenMs: 500,
    recipients: [
      { id: "R-001", destination: "GBZX...", asset: USDC, amount: "500" },
      { id: "R-002", destination: "GABC...", asset: USDC, amount: "250" },
    ],
  }}
  onComplete={(results) => {
    const confirmed = results.filter(r => r.status === "confirmed");
    console.log(`${confirmed.length} payments confirmed`);
  }}
/>
```

---

## Hooks

All components are built on exported hooks — use them directly for full control.

| Hook | Returns |
|------|---------|
| `useStellarWallet()` | `{ publicKey, connected, connect, disconnect, connecting, error }` |
| `useAssetBalances()` | `{ balances, loading, error, refetch }` |
| `useTransaction()` | `{ sendPayment, status, steps, result, error, reset }` |
| `useSingleUseWallet()` | `{ generate, wallet, revoke, isExpired, generating }` |
| `useBatchDisbursement()` | `{ execute, recipients, running, progress, error, reset }` |

```tsx
import { useStellarWallet, useTransaction } from "@stellar-pay/ui";

function CustomPayButton() {
  const { publicKey } = useStellarWallet();
  const { sendPayment, status } = useTransaction();

  return (
    <button
      disabled={!publicKey || status === "submitting"}
      onClick={() =>
        sendPayment({
          destination: "GBZX...WQCA",
          asset: { code: "XLM", issuer: null },
          amount: "10",
          memo: "tip",
        })
      }
    >
      {status === "submitting" ? "Sending…" : "Send 10 XLM"}
    </button>
  );
}
```

---

## Supported Networks

| Network | Horizon URL |
|---------|-------------|
| `mainnet` | `https://horizon.stellar.org` |
| `testnet` | `https://horizon-testnet.stellar.org` |
| `futurenet` | `https://horizon-futurenet.stellar.org` |

---

## Repo Structure

```
stellar-pay-ui/
├── packages/
│   └── ui/                    ← @stellar-pay/ui (the published package)
│       └── src/
│           ├── components/    ← WalletConnect, TransactionStatus, …
│           ├── hooks/         ← useStellarWallet, useTransaction, …
│           ├── providers/     ← StellarPayProvider
│           └── types/         ← shared TypeScript types
└── apps/
    └── docs/                  ← Next.js 14 live demo site
```

Built as a **pnpm + Turborepo monorepo**. The `@stellar-pay/ui` package is framework-agnostic and works in any React 18+ app (Next.js, Vite, CRA, Remix).

---

## Contributing

```bash
git clone https://github.com/DevelopersHelpDesk/stellar-pay-ui
cd stellar-pay-ui
pnpm install
pnpm dev   # runs the docs site + package in watch mode
```

PRs welcome. Open an issue first for large changes.

---

## Drips Network Wave Program

This library is built as reusable infrastructure for the [Drips Network Wave Program](https://drips.network). Any Wave maintainer can add `@stellar-pay/ui` as a peer dependency instead of writing wallet + payment UI from scratch.

---

## First-Time Setup Checklist

Before pushing to GitHub, replace these placeholders:

- [ ] `YOUR_ORG` in `README.md` and `packages/ui/package.json` → your GitHub org/username
- [ ] Add `NPM_TOKEN` secret in your GitHub repo settings (for the CI publish job)
- [ ] Deploy `apps/docs` to Vercel and update the `url` in `apps/docs/src/app/layout.tsx`
- [ ] Update `packages/ui/package.json` `"version"` when ready to publish to npm

---

## License

[MIT](./LICENSE)
