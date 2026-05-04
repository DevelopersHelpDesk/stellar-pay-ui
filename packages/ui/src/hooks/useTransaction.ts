import { useState, useCallback } from "react";
import {
  TransactionBuilder,
  BASE_FEE,
  Asset,
  Operation,
  Memo,
  type Horizon,
} from "@stellar/stellar-sdk";
import { useStellarPay } from "../providers/StellarPayProvider";
import type {
  PaymentParams,
  TxStatus,
  TransactionResult,
  TransactionStep,
} from "../types";

const STEPS: Array<{ id: string; label: string }> = [
  { id: "build", label: "Building Transaction" },
  { id: "sign", label: "Signing" },
  { id: "submit", label: "Submitting" },
  { id: "confirm", label: "Confirmed" },
];

function initSteps(): TransactionStep[] {
  return STEPS.map((s) => ({ ...s, status: "waiting" }));
}

function markStep(
  steps: TransactionStep[],
  id: string,
  status: TransactionStep["status"],
  extra?: Partial<TransactionStep>
): TransactionStep[] {
  return steps.map((s) =>
    s.id === id ? { ...s, status, ...extra } : s
  );
}

export interface UseTransactionReturn {
  status: TxStatus;
  steps: TransactionStep[];
  result: TransactionResult | null;
  error: string | null;
  sendPayment: (params: PaymentParams) => Promise<TransactionResult | null>;
  reset: () => void;
}

/**
 * Orchestrates the full transaction lifecycle:
 * build → sign (via wallet) → submit → confirm.
 *
 * @example
 * const { sendPayment, status, steps } = useTransaction();
 * await sendPayment({ destination, asset, amount, memo });
 */
export function useTransaction(): UseTransactionReturn {
  const { server, wallet, signTransaction, networkConfig } = useStellarPay();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [steps, setSteps] = useState<TransactionStep[]>(initSteps());
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setSteps(initSteps());
    setResult(null);
    setError(null);
  }, []);

  const sendPayment = useCallback(
    async (params: PaymentParams): Promise<TransactionResult | null> => {
      if (!wallet.publicKey) {
        setError("No wallet connected.");
        return null;
      }

      reset();
      let currentSteps = initSteps();

      const update = (id: string, s: TransactionStep["status"], extra?: Partial<TransactionStep>) => {
        currentSteps = markStep(currentSteps, id, s, extra);
        setSteps([...currentSteps]);
      };

      try {
        // ── 1. Build ──────────────────────────────────────────────────────────
        setStatus("building");
        update("build", "active");

        const sourceAccount = await server.loadAccount(wallet.publicKey);

        const asset =
          params.asset.issuer === null
            ? Asset.native()
            : new Asset(params.asset.code, params.asset.issuer);

        const txBuilder = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: networkConfig.networkPassphrase,
        }).addOperation(
          Operation.payment({
            destination: params.destination,
            asset,
            amount: params.amount,
          })
        );

        if (params.memo) {
          switch (params.memoType ?? "text") {
            case "text":
              txBuilder.addMemo(Memo.text(params.memo));
              break;
            case "id":
              txBuilder.addMemo(Memo.id(params.memo));
              break;
            case "hash":
              txBuilder.addMemo(Memo.hash(params.memo));
              break;
          }
        }

        const tx = txBuilder.setTimeout(30).build();
        update("build", "done");

        // ── 2. Sign ───────────────────────────────────────────────────────────
        setStatus("signing");
        update("sign", "active");

        const signedXdr = await signTransaction(tx.toXDR());
        update("sign", "done");

        // ── 3. Submit ─────────────────────────────────────────────────────────
        setStatus("submitting");
        update("submit", "active");

        const signedTx = TransactionBuilder.fromXDR(signedXdr, networkConfig.networkPassphrase);

        const response = (await server.submitTransaction(
          signedTx
        )) as Horizon.HorizonApi.TransactionResponse;

        update("submit", "done");

        // ── 4. Confirm ────────────────────────────────────────────────────────
        update("confirm", "done", {
          ledger: response.ledger,
          timestamp: Date.now(),
        });

        const txResult: TransactionResult = {
          hash: response.hash,
          ledger: response.ledger,
          createdAt: response.created_at,
          fee: response.fee_charged?.toString() ?? BASE_FEE,
          successful: response.successful,
          envelopeXdr: response.envelope_xdr,
          resultXdr: response.result_xdr,
        };

        setResult(txResult);
        setStatus("success");
        return txResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed.";
        setError(msg);
        setStatus("error");

        // Mark the currently active step as errored
        currentSteps = currentSteps.map((s) =>
          s.status === "active" ? { ...s, status: "error" } : s
        );
        setSteps([...currentSteps]);
        return null;
      }
    },
    [wallet.publicKey, server, signTransaction, networkConfig, reset]
  );

  return { status, steps, result, error, sendPayment, reset };
}
