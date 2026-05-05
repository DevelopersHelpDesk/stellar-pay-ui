import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  Horizon,
} from "@stellar/stellar-sdk";
import type {
  StellarNetwork,
  NetworkConfig,
  WalletState,
  WalletType,
} from "../types";
import { NETWORK_CONFIGS } from "../types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface StellarPayContextValue {
  // Network
  networkConfig: NetworkConfig;
  server: Horizon.Server;

  // Wallet
  wallet: WalletState;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;

  // Signing (abstract — delegates to wallet adapter)
  signTransaction: (xdr: string) => Promise<string>;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultWallet: WalletState = {
  connected: false,
  publicKey: null,
  walletType: null,
  network: null,
};

const StellarPayContext = createContext<StellarPayContextValue | null>(null);

// ─── Wallet adapters ──────────────────────────────────────────────────────────

/**
 * Freighter adapter — uses @stellar/freighter-api v6.
 * Dynamically imported so the library doesn't hard-require it for consumers
 * who use Albedo or xBull instead.
 *
 * v6 API changes vs older versions:
 *   - isConnected()      → returns { isConnected: boolean, error? }
 *   - requestAccess()    → returns { address: string, error? }
 *   - getAddress()       → returns { address: string, error? }
 *   - getNetworkDetails()→ returns { network, networkUrl, networkPassphrase, error? }
 *   - signTransaction()  → returns { signedTxXdr: string, signerAddress, error? }
 */
async function connectFreighter(network: StellarNetwork): Promise<string> {
  const freighter = await import("@stellar/freighter-api").catch(() => {
    throw new Error(
      "Freighter not installed. Visit https://freighter.app to install the browser extension."
    );
  });

  // v6: isConnected returns an object { isConnected: boolean, error? }
  const connectedResult = await freighter.isConnected();
  if (connectedResult.error) {
    throw new Error(`Freighter error: ${connectedResult.error}`);
  }
  if (!connectedResult.isConnected) {
    throw new Error("Freighter extension is not connected. Open the extension and unlock it.");
  }

  // v6: requestAccess returns { address: string, error? }
  const accessResult = await freighter.requestAccess();
  if (accessResult.error) {
    throw new Error(`Freighter access denied: ${accessResult.error}`);
  }

  // v6: getNetworkDetails returns { network, networkUrl, networkPassphrase, error? }
  const networkResult = await freighter.getNetworkDetails();
  if (networkResult.error) {
    throw new Error(`Freighter network error: ${networkResult.error}`);
  }

  // Normalise Freighter network name to our StellarNetwork type
  // Freighter returns "TESTNET", "PUBLIC", "FUTURENET" etc.
  const freighterNet = networkResult.network?.toLowerCase() ?? "";
  const normalised =
    freighterNet.includes("test") ? "testnet" :
    freighterNet.includes("future") ? "futurenet" :
    "mainnet";

  if (normalised !== network) {
    throw new Error(
      `Freighter is on ${networkResult.network}, but the app expects ${network}. ` +
      `Please switch networks in the Freighter extension.`
    );
  }

  // v6: use getAddress() for the public key (getPublicKey removed in v3+)
  const addressResult = await freighter.getAddress();
  if (addressResult.error) {
    throw new Error(`Freighter address error: ${addressResult.error}`);
  }

  return addressResult.address;
}

async function signWithFreighter(xdr: string, networkPassphrase: string): Promise<string> {
  const freighter = await import("@stellar/freighter-api");

  // v6: signTransaction returns { signedTxXdr: string, signerAddress: string, error? }
  const result = await freighter.signTransaction(xdr, { networkPassphrase });
  if (result.error) {
    throw new Error(`Freighter signing error: ${result.error}`);
  }
  return result.signedTxXdr;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface StellarPayProviderProps {
  network?: StellarNetwork;
  children: ReactNode;
}

export function StellarPayProvider({
  network = "mainnet",
  children,
}: StellarPayProviderProps) {
  const networkConfig = NETWORK_CONFIGS[network];
  const server = new Horizon.Server(networkConfig.horizonUrl);

  const [wallet, setWallet] = useState<WalletState>(defaultWallet);

  // Persist wallet state across page refreshes
  useEffect(() => {
    const stored = sessionStorage.getItem("stellar-pay-wallet");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WalletState;
        setWallet(parsed);
      } catch {
        // ignore malformed stored state
      }
    }
  }, []);

  const connect = useCallback(
    async (walletType: WalletType) => {
      let publicKey: string;

      switch (walletType) {
        case "freighter":
          publicKey = await connectFreighter(network);
          break;
        case "albedo":
          throw new Error(
            "Albedo adapter: import @albedo-link/intent and call intent.publicKey(). See docs."
          );
        case "xbull":
          throw new Error(
            "xBull adapter: use xBull Wallet SDK. See docs."
          );
        case "private-key":
          throw new Error(
            "Private-key signing is for server-side / Node.js use only. Use SingleUseWallet for that flow."
          );
        default:
          throw new Error(`Unknown wallet type: ${walletType}`);
      }

      const nextState: WalletState = {
        connected: true,
        publicKey,
        walletType,
        network,
      };

      setWallet(nextState);
      sessionStorage.setItem("stellar-pay-wallet", JSON.stringify(nextState));
    },
    [network]
  );

  const disconnect = useCallback(() => {
    setWallet(defaultWallet);
    sessionStorage.removeItem("stellar-pay-wallet");
  }, []);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!wallet.connected || !wallet.walletType) {
        throw new Error("No wallet connected.");
      }
      switch (wallet.walletType) {
        case "freighter":
          return signWithFreighter(xdr, networkConfig.networkPassphrase);
        default:
          throw new Error(
            `signTransaction not implemented for wallet type: ${wallet.walletType}`
          );
      }
    },
    [wallet, networkConfig.networkPassphrase]
  );

  return (
    <StellarPayContext.Provider
      value={{ networkConfig, server, wallet, connect, disconnect, signTransaction }}
    >
      {children}
    </StellarPayContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStellarPay(): StellarPayContextValue {
  const ctx = useContext(StellarPayContext);
  if (!ctx) {
    throw new Error(
      "useStellarPay must be used inside <StellarPayProvider>. " +
        "Wrap your app with <StellarPayProvider network='mainnet'>."
    );
  }
  return ctx;
}
