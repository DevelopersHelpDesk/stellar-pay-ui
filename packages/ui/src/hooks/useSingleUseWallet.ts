import { useState, useCallback } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import type { SingleUseWalletConfig, SingleUseWalletResult } from "../types";

export interface UseSingleUseWalletReturn {
  wallet: SingleUseWalletResult | null;
  generating: boolean;
  error: string | null;
  generate: (config: SingleUseWalletConfig) => Promise<SingleUseWalletResult | null>;
  revoke: () => void;
  isExpired: boolean;
}

/**
 * Generates on-demand single-use Stellar keypairs for the
 * Stellar Disbursement Platform (SDP) wallet flow.
 *
 * The secret key is held in memory only — it is never persisted
 * to localStorage or sessionStorage.
 *
 * @example
 * const { generate, wallet } = useSingleUseWallet();
 * const result = await generate({ purpose: "invoice-1042", expiresInSeconds: 1800, expectedAsset: USDC });
 */
export function useSingleUseWallet(): UseSingleUseWalletReturn {
  const [wallet, setWallet] = useState<SingleUseWalletResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (config: SingleUseWalletConfig): Promise<SingleUseWalletResult | null> => {
      setGenerating(true);
      setError(null);

      try {
        // Derive keypair — entirely client-side, no network call needed
        const keypair = Keypair.random();

        const now = Date.now();
        const result: SingleUseWalletResult = {
          publicKey: keypair.publicKey(),
          secretKey: keypair.secret(),
          createdAt: now,
          expiresAt: now + config.expiresInSeconds * 1000,
          purpose: config.purpose,
        };

        setWallet(result);

        // Auto-revoke when TTL expires
        if (config.autoRevoke !== false) {
          setTimeout(() => {
            setWallet((current) => {
              if (current?.publicKey === result.publicKey) return null;
              return current;
            });
          }, config.expiresInSeconds * 1000);
        }

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to generate wallet.";
        setError(msg);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const revoke = useCallback(() => {
    setWallet(null);
  }, []);

  const isExpired = wallet ? Date.now() > wallet.expiresAt : false;

  return { wallet, generating, error, generate, revoke, isExpired };
}
