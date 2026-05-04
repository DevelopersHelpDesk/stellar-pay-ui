// ─── Network ──────────────────────────────────────────────────────────────────

export type StellarNetwork = "mainnet" | "testnet" | "futurenet";

export interface NetworkConfig {
  network: StellarNetwork;
  horizonUrl: string;
  networkPassphrase: string;
}

export const NETWORK_CONFIGS: Record<StellarNetwork, NetworkConfig> = {
  mainnet: {
    network: "mainnet",
    horizonUrl: "https://horizon.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  },
  testnet: {
    network: "testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  futurenet: {
    network: "futurenet",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    networkPassphrase: "Test SDF Future Network ; October 2022",
  },
};

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletType = "freighter" | "albedo" | "xbull" | "private-key";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  network: StellarNetwork | null;
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export interface StellarAsset {
  code: string;
  issuer: string | null; // null = native XLM
  name?: string;
  image?: string;
}

export interface AssetBalance {
  asset: StellarAsset;
  balance: string;
  limit?: string;
  buyingLiabilities?: string;
  sellingLiabilities?: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TxStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "pending"
  | "success"
  | "error";

/** @deprecated Use TxStatus. TransactionStatus is reserved for the component. */
export type TransactionStatus = TxStatus;

export interface TransactionStep {
  id: string;
  label: string;
  status: "waiting" | "active" | "done" | "error";
  ledger?: number;
  timestamp?: number;
}

export interface TransactionResult {
  hash: string;
  ledger: number;
  createdAt: string;
  fee: string;
  successful: boolean;
  envelopeXdr: string;
  resultXdr: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface PaymentParams {
  destination: string;
  asset: StellarAsset;
  amount: string;
  memo?: string;
  memoType?: "text" | "id" | "hash" | "return";
}

// ─── Single-use wallet (SDP) ──────────────────────────────────────────────────

export interface SingleUseWalletConfig {
  purpose: string;
  expectedAsset: StellarAsset;
  expiresInSeconds: number;
  autoRevoke?: boolean;
}

export interface SingleUseWalletResult {
  publicKey: string;
  secretKey: string;
  createdAt: number;
  expiresAt: number;
  purpose: string;
}

// ─── Batch disbursement ───────────────────────────────────────────────────────

export type DisbursementStatus =
  | "queued"
  | "building"
  | "signing"
  | "submitting"
  | "confirmed"
  | "failed";

export interface DisbursementRecipient {
  id: string;
  name?: string;
  destination: string;
  asset: StellarAsset;
  amount: string;
  memo?: string;
  status: DisbursementStatus;
  txHash?: string;
  error?: string;
}

export interface BatchDisbursementConfig {
  recipients: Omit<DisbursementRecipient, "status">[];
  signerPublicKey: string;
  delayBetweenMs?: number;
}
