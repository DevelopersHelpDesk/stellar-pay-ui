import React, { type CSSProperties } from "react";
import type { TransactionStep, TransactionStatus as TStatus, TransactionResult } from "../../types";

export interface TransactionStatusProps {
  /** Current high-level status from useTransaction */
  status: TStatus;
  /** Granular step array from useTransaction */
  steps: TransactionStep[];
  /** Populated once the transaction confirms */
  result?: TransactionResult | null;
  /** Error message if status === 'error' */
  error?: string | null;
  /** Link to Stellar Expert for the confirmed hash */
  explorerBaseUrl?: string;
  className?: string;
  style?: CSSProperties;
}

const STEP_COLOR: Record<TransactionStep["status"], string> = {
  waiting: "#2a4a68",
  active: "#8dc8e0",
  done: "#10d070",
  error: "#ff6b6b",
};

/**
 * `TransactionStatus` renders a vertical step-by-step tracker
 * for a Stellar transaction lifecycle. Pair with `useTransaction`.
 *
 * @example
 * const { status, steps, result } = useTransaction();
 * <TransactionStatus status={status} steps={steps} result={result} />
 */
export function TransactionStatus({
  status,
  steps,
  result,
  error,
  explorerBaseUrl = "https://stellar.expert/explorer/public/tx",
  className,
  style,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 12, ...style }}
      aria-live="polite"
      data-testid="transaction-status"
    >
      {/* Step tracker */}
      <div style={{ position: "relative", paddingLeft: 28 }}>
        {/* Vertical rail */}
        <div
          style={{
            position: "absolute",
            left: 9,
            top: 12,
            bottom: 12,
            width: 2,
            background: "#1e3a55",
          }}
        />

        {steps.map((step, i) => {
          const color = STEP_COLOR[step.status];
          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: i < steps.length - 1 ? 20 : 0,
                opacity: step.status === "waiting" ? 0.4 : 1,
                transition: "opacity 0.3s",
              }}
            >
              {/* Node */}
              <div
                aria-label={`Step ${step.label}: ${step.status}`}
                style={{
                  position: "absolute",
                  left: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background:
                    step.status === "done" ? color : "#0a1520",
                  border: `2px solid ${color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s",
                }}
              >
                {step.status === "done" && (
                  <span style={{ color: "#020408", fontSize: 10, fontWeight: 900 }}>✓</span>
                )}
                {step.status === "error" && (
                  <span style={{ color: "#ff6b6b", fontSize: 10 }}>✕</span>
                )}
                {step.status === "active" && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: color,
                      display: "block",
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <div style={{ paddingLeft: 4 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: step.status === "waiting" ? "#4a7a9b" : "#e8f4fb",
                  }}
                >
                  {step.label}
                </div>
                {step.status === "done" && step.ledger && (
                  <div
                    style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "monospace" }}
                  >
                    ledger #{step.ledger}
                  </div>
                )}
                {step.status === "active" && (
                  <div
                    style={{ fontSize: 10, color: color, fontFamily: "monospace" }}
                  >
                    processing…
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Success banner */}
      {status === "success" && result && (
        <div
          role="status"
          style={{
            padding: "10px 14px",
            background: "#10d07012",
            border: "1px solid #10d07040",
            borderRadius: 8,
            color: "#10d070",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          ✓ Confirmed on ledger #{result.ledger}
          {explorerBaseUrl && (
            <a
              href={`${explorerBaseUrl}/${result.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 4,
                color: "#8dc8e0",
                fontSize: 11,
                textDecoration: "underline",
              }}
            >
              {result.hash.slice(0, 8)}…{result.hash.slice(-6)} ↗
            </a>
          )}
        </div>
      )}

      {/* Error banner */}
      {status === "error" && error && (
        <div
          role="alert"
          style={{
            padding: "10px 14px",
            background: "#ff6b6b12",
            border: "1px solid #ff6b6b40",
            borderRadius: 8,
            color: "#ff6b6b",
            fontSize: 12,
          }}
        >
          ✕ {error}
        </div>
      )}
    </div>
  );
}
