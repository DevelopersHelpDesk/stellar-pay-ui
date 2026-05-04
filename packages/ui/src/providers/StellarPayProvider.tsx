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
 * Freighter adapter — uses the @stellar-friendbot/freighter-api browser extension.
 * Dynamically imported so the library doesn't hard-require it.
 */
async function connectFreighter(network: StellarNetwork): Promise<string> {
  // Dynamic import so consumers who don't use Freighter aren't penalised
  const freighter = await import(
    /* webpackIgnore: true */ "@stellar-friendbot/freighter-api"
  ).catch(() => {
    throw new Error(
      "Freighter not installed. Visit https://freighter.app to install the extension."
    );
  });

  const connected = await freighter.isConnected();
  if (!connected) {
    throw new Error("Freighter extension is not connected.");
  }

  await freighter.requestAccess();

  const networkDetails = await freighter.getNetworkDetails();
  if (networkDetails.network !== network) {
    throw new Error(
      `Freighter is on ${networkDetails.network}, but the app expects ${network}. Please switch networks in Freighter.`
    );
  }

  const publicKey = await freighter.getPublicKey();
  return publicKey;
}

async function signWithFreighter(xdr: string, networkPassphrase: string): Promise<string> {
  const freighter = await import(
    /* webpackIgnore: true */ "@stellar-friendbot/freighter-api"
  );
  const result = await freighter.signTransaction(xdr, { networkPassphrase });
  return result;
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
