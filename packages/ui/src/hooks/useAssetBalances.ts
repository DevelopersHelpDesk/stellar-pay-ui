import { useState, useEffect, useCallback } from "react";
import { useStellarPay } from "../providers/StellarPayProvider";
import type { AssetBalance, StellarAsset } from "../types";

const NATIVE_ASSET: StellarAsset = { code: "XLM", issuer: null, name: "Stellar Lumens" };

function parseBalance(record: HorizonBalanceRecord): AssetBalance {
  if (record.asset_type === "native") {
    return {
      asset: NATIVE_ASSET,
      balance: record.balance,
      buyingLiabilities: record.buying_liabilities,
      sellingLiabilities: record.selling_liabilities,
    };
  }
  return {
    asset: {
      code: record.asset_code!,
      issuer: record.asset_issuer!,
    },
    balance: record.balance,
    limit: record.limit,
    buyingLiabilities: record.buying_liabilities,
    sellingLiabilities: record.selling_liabilities,
  };
}

// Minimal Horizon balance shape we care about
interface HorizonBalanceRecord {
  asset_type: "native" | "credit_alphanum4" | "credit_alphanum12";
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
}

export interface UseAssetBalancesReturn {
  balances: AssetBalance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches all asset balances for the connected wallet from Horizon.
 * Auto-refreshes when the public key changes.
 *
 * @example
 * const { balances, loading } = useAssetBalances();
 */
export function useAssetBalances(): UseAssetBalancesReturn {
  const { server, wallet } = useStellarPay();
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalances([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const account = await server.loadAccount(wallet.publicKey);
      const parsed = (account.balances as HorizonBalanceRecord[]).map(parseBalance);
      // Native XLM first, then alphabetical
      parsed.sort((a, b) => {
        if (!a.asset.issuer) return -1;
        if (!b.asset.issuer) return 1;
        return a.asset.code.localeCompare(b.asset.code);
      });
      setBalances(parsed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load account balances."
      );
    } finally {
      setLoading(false);
    }
  }, [server, wallet.publicKey]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, loading, error, refetch: fetchBalances };
}
