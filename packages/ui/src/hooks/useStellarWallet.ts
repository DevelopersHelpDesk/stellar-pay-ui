import { useState, useCallback } from "react";
import { useStellarPay } from "../providers/StellarPayProvider";
import type { WalletType } from "../types";

export interface UseStellarWalletReturn {
  publicKey: string | null;
  connected: boolean;
  walletType: WalletType | null;
  connecting: boolean;
  error: string | null;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  shortKey: string | null;
}

/**
 * High-level hook for wallet connection state.
 * Wraps useStellarPay with loading + error state.
 */
export function useStellarWallet(): UseStellarWalletReturn {
  const { wallet, connect: ctxConnect, disconnect } = useStellarPay();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(
    async (walletType: WalletType) => {
      setConnecting(true);
      setError(null);
      try {
        await ctxConnect(walletType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect wallet.");
      } finally {
        setConnecting(false);
      }
    },
    [ctxConnect]
  );

  const shortKey = wallet.publicKey
    ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-4)}`
    : null;

  return {
    publicKey: wallet.publicKey,
    connected: wallet.connected,
    walletType: wallet.walletType,
    connecting,
    error,
    connect,
    disconnect,
    shortKey,
  };
}
