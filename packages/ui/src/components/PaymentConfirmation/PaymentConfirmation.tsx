import React, { useState, type CSSProperties, type FormEvent } from "react";
import { useTransaction } from "../../hooks/useTransaction";
import { TransactionStatus } from "../TransactionStatus/TransactionStatus";
import type { PaymentParams, StellarAsset } from "../../types";

const XLM_NATIVE: StellarAsset = { code: "XLM", issuer: null };
const USDC_MAINNET: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

const DEFAULT_ASSETS: StellarAsset[] = [XLM_NATIVE, USDC_MAINNET];

export interface PaymentConfirmationProps {
  /** Pre-fill the destination address */
  defaultDestination?: string;
  /** Pre-fill the amount */
  defaultAmount?: string;
  /** Assets the user can select from */
  assets?: StellarAsset[];
  /** Called on successful payment */
  onSuccess?: (txHash: string) => void;
  /** Called on failed payment */
  onError?: (error: string) => void;
  className?: string;
  style?: CSSProperties;
}

type Phase = "form" | "review" | "transacting";

/**
 * `PaymentConfirmation` is a 3-phase flow component:
 *   1. **Form** — destination, asset, amount, memo inputs
 *   2. **Review** — summary with fee estimate before signing
 *   3. **Transacting** — `TransactionStatus` tracker through to confirmation
 *
 * Wired to `useTransaction` — no extra setup needed.
 *
 * @example
 * <PaymentConfirmation
 *   defaultDestination="GBZX...WQCA"
 *   onSuccess={(hash) => toast.success(`TX: ${hash}`)}
 * />
 */
export function PaymentConfirmation({
  defaultDestination = "",
  defaultAmount = "",
  assets = DEFAULT_ASSETS,
  onSuccess,
  onError,
  className,
  style,
}: PaymentConfirmationProps) {
  const { status, steps, result, error, sendPayment, reset } = useTransaction();

  const [phase, setPhase] = useState<Phase>("form");
  const [destination, setDestination] = useState(defaultDestination);
  const [amount, setAmount] = useState(defaultAmount);
  const [memo, setMemo] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<StellarAsset>(assets[0]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Basic Stellar address validation
  const validate = (): boolean => {
    if (!destination.match(/^G[A-Z2-7]{55}$/)) {
      setValidationError("Invalid Stellar address. Must start with G and be 56 characters.");
      return false;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setValidationError("Enter a valid positive amount.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleReview = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) setPhase("review");
  };

  const handleConfirm = async () => {
    setPhase("transacting");
    const params: PaymentParams = {
      destination,
      asset: selectedAsset,
      amount,
      memo: memo || undefined,
    };
    const result = await sendPayment(params);
    if (result) {
      onSuccess?.(result.hash);
    } else if (error) {
      onError?.(error);
    }
  };

  const handleReset = () => {
    reset();
    setPhase("form");
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "#050d14",
    border: "1px solid #1e3a55",
    borderRadius: 8,
    color: "#e8f4fb",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "#4a7a9b",
    fontFamily: "monospace",
    letterSpacing: "0.06em",
    marginBottom: 5,
    textTransform: "uppercase",
  };

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 16, ...style }}
      data-testid="payment-confirmation"
    >
      {/* ── Phase 1: Form ────────────────────────────────────────────────── */}
      {phase === "form" && (
        <form onSubmit={handleReview} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Recipient Address</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="G…"
              style={{ ...inputStyle, fontFamily: "monospace" }}
              aria-label="Recipient Stellar address"
            />
          </div>

          <div>
            <label style={labelStyle}>Asset</label>
            <select
              value={`${selectedAsset.code}:${selectedAsset.issuer}`}
              onChange={(e) => {
                const [code, issuer] = e.target.value.split(":");
                setSelectedAsset({ code, issuer: issuer === "null" ? null : issuer });
              }}
              style={{ ...inputStyle }}
              aria-label="Payment asset"
            >
              {assets.map((a) => (
                <option key={`${a.code}:${a.issuer}`} value={`${a.code}:${a.issuer}`}>
                  {a.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              style={inputStyle}
              aria-label="Payment amount"
            />
          </div>

          <div>
            <label style={labelStyle}>Memo (optional)</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Invoice #, reference…"
              maxLength={28}
              style={inputStyle}
              aria-label="Transaction memo"
            />
          </div>

          {validationError && (
            <div role="alert" style={{ color: "#ff6b6b", fontSize: 12 }}>
              {validationError}
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: "11px 0",
              background: "linear-gradient(135deg, #8dc8e022, #10d07022)",
              border: "1px solid #8dc8e050",
              borderRadius: 8,
              color: "#b8dff0",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Review Payment →
          </button>
        </form>
      )}

      {/* ── Phase 2: Review ─────────────────────────────────────────────── */}
      {phase === "review" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: 16,
              background: "#050d14",
              border: "1px solid #1e3a55",
              borderRadius: 12,
            }}
          >
            {/* Amount hero */}
            <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #1e3a55" }}>
              <div style={{ fontSize: 11, color: "#4a7a9b", fontFamily: "monospace", marginBottom: 4 }}>SENDING</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#e8f4fb" }}>
                {amount}{" "}
                <span style={{ color: "#8dc8e0", fontSize: 18 }}>{selectedAsset.code}</span>
              </div>
            </div>

            {/* Details */}
            {[
              ["To", `${destination.slice(0, 8)}…${destination.slice(-4)}`],
              ["Memo", memo || "—"],
              ["Network Fee", "~0.00001 XLM"],
              ["Est. Confirmation", "~5 seconds"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ color: "#4a7a9b", fontSize: 12 }}>{label}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#b8dff0" }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPhase("form")}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "transparent",
                border: "1px solid #1e3a55",
                borderRadius: 8,
                color: "#6ba3c0",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 2,
                padding: "10px 0",
                background: "linear-gradient(135deg, #8dc8e0, #10d070)",
                border: "none",
                borderRadius: 8,
                color: "#020408",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              Confirm & Sign
            </button>
          </div>
        </div>
      )}

      {/* ── Phase 3: Transaction in progress / done ──────────────────────── */}
      {phase === "transacting" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TransactionStatus
            status={status}
            steps={steps}
            result={result}
            error={error}
          />
          {(status === "success" || status === "error") && (
            <button
              onClick={handleReset}
              style={{
                padding: "9px 0",
                background: "transparent",
                border: "1px solid #1e3a55",
                borderRadius: 8,
                color: "#6ba3c0",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              New Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
