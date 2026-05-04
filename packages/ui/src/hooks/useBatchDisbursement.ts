import { useState, useCallback } from "react";
import {
  TransactionBuilder,
  BASE_FEE,
  Asset,
  Operation,
  Memo,
} from "@stellar/stellar-sdk";
import { useStellarPay } from "../providers/StellarPayProvider";
import type {
  BatchDisbursementConfig,
  DisbursementRecipient,
  DisbursementStatus,
} from "../types";

export interface UseBatchDisbursementReturn {
  recipients: DisbursementRecipient[];
  running: boolean;
  progress: number; // 0–100
  error: string | null;
  execute: (config: BatchDisbursementConfig) => Promise<void>;
  reset: () => void;
}

/**
 * Executes sequential batch payments on the Stellar network.
 * Each recipient gets their own transaction to maximise reliability
 * and give granular per-recipient status tracking.
 *
 * Designed for SDP enterprise disbursement flows where the signing
 * key is a custodial server-side key or a SingleUseWallet secret.
 *
 * @example
 * const { execute, recipients, progress } = useBatchDisbursement();
 * await execute({ recipients, signerPublicKey: key, delayBetweenMs: 500 });
 */
export function useBatchDisbursement(): UseBatchDisbursementReturn {
  const { server, networkConfig, signTransaction } = useStellarPay();
  const [recipients, setRecipients] = useState<DisbursementRecipient[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRecipient = (
    id: string,
    update: Partial<DisbursementRecipient>
  ) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...update } : r))
    );
  };

  const reset = useCallback(() => {
    setRecipients([]);
    setRunning(false);
    setError(null);
  }, []);

  const execute = useCallback(
    async (config: BatchDisbursementConfig) => {
      setRunning(true);
      setError(null);

      // Initialise recipients list with queued status
      const initial: DisbursementRecipient[] = config.recipients.map((r) => ({
        ...r,
        status: "queued" as DisbursementStatus,
      }));
      setRecipients(initial);

      let successCount = 0;

      for (const recipient of config.recipients) {
        // Mark as building
        updateRecipient(recipient.id, { status: "building" });

        try {
          // Load source account for fresh sequence number each tx
          const sourceAccount = await server.loadAccount(
            config.signerPublicKey
          );

          const asset =
            recipient.asset.issuer === null
              ? Asset.native()
              : new Asset(recipient.asset.code, recipient.asset.issuer);

          const txBuilder = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: networkConfig.networkPassphrase,
          }).addOperation(
            Operation.payment({
              destination: recipient.destination,
              asset,
              amount: recipient.amount,
            })
          );

          if (recipient.memo) {
            txBuilder.addMemo(Memo.text(recipient.memo.slice(0, 28)));
          }

          const tx = txBuilder.setTimeout(30).build();

          // Sign
          updateRecipient(recipient.id, { status: "signing" });
          const signedXdr = await signTransaction(tx.toXDR());

          // Submit
          updateRecipient(recipient.id, { status: "submitting" });
          const signedTx = TransactionBuilder.fromXDR(signedXdr, networkConfig.networkPassphrase);
          const response = await server.submitTransaction(signedTx);

          updateRecipient(recipient.id, {
            status: "confirmed",
            txHash: (response as { hash: string }).hash,
          });
          successCount++;
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Payment failed.";
          updateRecipient(recipient.id, { status: "failed", error: msg });
          // Continue with remaining recipients even if one fails
        }

        // Delay between transactions to avoid sequence number collisions
        if (config.delayBetweenMs) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.delayBetweenMs)
          );
        }
      }

      setRunning(false);

      if (successCount < config.recipients.length) {
        setError(
          `${config.recipients.length - successCount} payment(s) failed. Check individual statuses.`
        );
      }
    },
    [server, networkConfig, signTransaction]
  );

  const confirmedCount = recipients.filter(
    (r) => r.status === "confirmed"
  ).length;
  const progress =
    recipients.length > 0
      ? Math.round((confirmedCount / recipients.length) * 100)
      : 0;

  return { recipients, running, progress, error, execute, reset };
}
