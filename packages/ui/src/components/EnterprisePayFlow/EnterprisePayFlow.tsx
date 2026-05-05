import React, { type CSSProperties } from "react";
import { useBatchDisbursement } from "../../hooks/useBatchDisbursement";
import type {
  BatchDisbursementConfig,
  DisbursementRecipient,
  DisbursementStatus,
} from "../../types";

export interface EnterprisePayFlowProps {
  /** The batch to execute */
  config: BatchDisbursementConfig;
  /** Called when all payments complete (some may have failed) */
  onComplete?: (recipients: DisbursementRecipient[]) => void;
  className?: string;
  style?: CSSProperties;
}

const STATUS_COLORS: Record<DisbursementStatus, string> = {
  queued: "#2a4a68",
  building: "#f0b429",
  signing: "#f0b429",
  submitting: "#8dc8e0",
  confirmed: "#10d070",
  failed: "#ff6b6b",
};

const STATUS_LABELS: Record<DisbursementStatus, string> = {
  queued: "Queued",
  building: "Building",
  signing: "Signing",
  submitting: "Sending",
  confirmed: "Confirmed",
  failed: "Failed",
};

/**
 * `EnterprisePayFlow` renders a real-time batch disbursement UI.
 * Each recipient shows individual status — building → signing → submitting → confirmed/failed.
 *
 * @example
 * <EnterprisePayFlow
 *   config={{ recipients, signerPublicKey, delayBetweenMs: 500 }}
 *   onComplete={(results) => console.log(results)}
 * />
 */
export function EnterprisePayFlow({
  config,
  onComplete,
  className,
  style,
}: EnterprisePayFlowProps) {
  const { recipients, running, progress, error, execute, reset } =
    useBatchDisbursement();

  const initialized = recipients.length > 0;
  const allDone = initialized && !running && recipients.every(
    (r) => r.status === "confirmed" || r.status === "failed"
  );

  const handleExecute = async () => {
    reset();
    await execute(config);
    if (onComplete) {
      // Recipients is state — capture via closure after async
      onComplete(recipients);
    }
  };

  const confirmedCount = recipients.filter((r) => r.status === "confirmed").length;
  const failedCount = recipients.filter((r) => r.status === "failed").length;

  // Normalise both sources to a single display shape — no union needed
  type DisplayRow = {
    id: string;
    name?: string;
    destination: string;
    amount: string;
    assetCode: string;
    status: DisbursementStatus;
    txHash?: string;
    error?: string;
  };

  const displayList: DisplayRow[] = initialized
    ? recipients.map((r) => ({
        id: r.id,
        name: r.name,
        destination: r.destination,
        amount: r.amount,
        assetCode: r.asset.code,
        status: r.status,
        txHash: r.txHash,
        error: r.error,
      }))
    : config.recipients.map((r) => ({
        id: r.id,
        name: r.name,
        destination: r.destination,
        amount: r.amount,
        assetCode: r.asset.code,
        status: "queued" as DisbursementStatus,
      }));

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 12, ...style }}
      data-testid="enterprise-pay-flow"
    >
      {/* Header stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#4a7a9b",
            fontFamily: "monospace",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Batch Disbursement
        </span>
        {initialized && (
          <span style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "monospace" }}>
            {confirmedCount}/{recipients.length} confirmed
            {failedCount > 0 && ` · ${failedCount} failed`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{ height: 3, background: "#1e3a55", borderRadius: 2, overflow: "hidden" }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: "linear-gradient(90deg, #8dc8e0, #10d070)",
            width: `${progress}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Recipient list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {displayList.map((r) => {
          const color = STATUS_COLORS[r.status];
          const active = r.status === "building" || r.status === "signing" || r.status === "submitting";

          return (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: active ? "#f0b42908" : "#0f1f2e",
                border: `1px solid ${active ? "#f0b42940" : r.status === "confirmed" ? "#10d07030" : r.status === "failed" ? "#ff6b6b30" : "#1e3a55"}`,
                borderRadius: 8,
                transition: "all 0.3s",
              }}
            >
              {/* Status dot */}
              <div
                aria-label={`Status: ${STATUS_LABELS[r.status]}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />

              {/* ID */}
              <span
                style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "monospace", flexShrink: 0 }}
              >
                {r.id}
              </span>

              {/* Name */}
              <span style={{ flex: 1, fontSize: 13, color: "#e8f4fb" }}>
                {r.name ?? r.destination.slice(0, 8) + "…"}
              </span>

              {/* Amount */}
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#b8dff0", flexShrink: 0 }}>
                {r.assetCode} {r.amount}
              </span>

              {/* Status badge */}
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}
              >
                {STATUS_LABELS[r.status]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          borderTop: "1px solid #1e3a55",
        }}
      >
        <span style={{ fontSize: 12, color: "#4a7a9b" }}>
          {config.recipients.length} recipients
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#e8f4fb" }}>
          {config.recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}{" "}
          {config.recipients[0]?.asset.code}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            background: "#ff6b6b12",
            border: "1px solid #ff6b6b40",
            borderRadius: 8,
            color: "#ff6b6b",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={allDone ? () => { reset(); } : handleExecute}
        disabled={running}
        aria-busy={running}
        style={{
          padding: "11px 0",
          background: running
            ? "transparent"
            : "linear-gradient(135deg, #8dc8e022, #10d07022)",
          border: "1px solid #8dc8e050",
          borderRadius: 8,
          color: "#b8dff0",
          cursor: running ? "not-allowed" : "pointer",
          fontWeight: 700,
          fontSize: 13,
          opacity: running ? 0.6 : 1,
        }}
      >
        {running
          ? `Disbursing (${confirmedCount}/${recipients.length})…`
          : allDone
          ? "✓ Complete — Reset"
          : "▶ Execute Batch"}
      </button>
    </div>
  );
}
