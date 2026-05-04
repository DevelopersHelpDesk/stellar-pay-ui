import React, { useState, type CSSProperties } from "react";
import { useAssetBalances } from "../../hooks/useAssetBalances";
import type { AssetBalance as AssetBalanceType } from "../../types";

export interface AssetBalanceProps {
  /** If provided, renders these balances instead of fetching from context */
  balances?: AssetBalanceType[];
  /** Called when the user clicks an action on an asset row */
  onAction?: (action: "send" | "swap" | "info", asset: AssetBalanceType) => void;
  /** Whether to show the send / swap / info action buttons */
  showActions?: boolean;
  className?: string;
  style?: CSSProperties;
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return balance;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return num.toFixed(num < 1 ? 7 : 2);
}

/**
 * `AssetBalance` renders all trustline balances for the connected wallet.
 * Uses `useAssetBalances` internally unless `balances` prop is supplied.
 *
 * @example
 * // Automatic — fetches from connected wallet
 * <AssetBalance onAction={(action, asset) => handleAction(action, asset)} />
 *
 * // Manual — supply your own data
 * <AssetBalance balances={myBalances} />
 */
export function AssetBalance({
  balances: balancesProp,
  onAction,
  showActions = true,
  className,
  style,
}: AssetBalanceProps) {
  const { balances: fetchedBalances, loading, error, refetch } = useAssetBalances();
  const balances = balancesProp ?? fetchedBalances;

  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => (prev === key ? null : key));
  };

  const assetKey = (b: AssetBalanceType) =>
    b.asset.issuer ? `${b.asset.code}:${b.asset.issuer}` : "XLM";

  if (loading && !balancesProp) {
    return (
      <div
        aria-busy
        aria-label="Loading balances"
        style={{ color: "#4a7a9b", fontSize: 13, padding: "12px 0" }}
      >
        Loading balances…
      </div>
    );
  }

  if (error && !balancesProp) {
    return (
      <div
        role="alert"
        style={{
          padding: "10px 12px",
          background: "#ff6b6b12",
          border: "1px solid #ff6b6b40",
          borderRadius: 8,
          color: "#ff6b6b",
          fontSize: 12,
        }}
      >
        {error}{" "}
        <button
          onClick={refetch}
          style={{ color: "#8dc8e0", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div style={{ color: "#4a7a9b", fontSize: 13 }}>
        No assets found. Fund this account to get started.
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}
      data-testid="asset-balance"
    >
      {balances.map((b) => {
        const key = assetKey(b);
        const isOpen = expanded === key;

        return (
          <div
            key={key}
            onClick={() => toggleExpand(key)}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            onKeyDown={(e) => e.key === "Enter" && toggleExpand(key)}
            style={{
              padding: "12px 14px",
              background: "#0f1f2e",
              border: `1px solid ${isOpen ? "#8dc8e060" : "#1e3a55"}`,
              borderRadius: 10,
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Asset icon */}
              <div
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#8dc8e020",
                  border: "2px solid #8dc8e040",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 11,
                  color: "#8dc8e0",
                  flexShrink: 0,
                }}
              >
                {b.asset.code.slice(0, 2)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#e8f4fb" }}>
                    {b.asset.code}
                  </span>
                  <span
                    style={{ fontFamily: "monospace", fontSize: 13, color: "#e8f4fb" }}
                  >
                    {formatBalance(b.balance)}
                  </span>
                </div>

                {b.asset.issuer && (
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "#4a7a9b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={b.asset.issuer}
                  >
                    {b.asset.issuer.slice(0, 8)}…{b.asset.issuer.slice(-4)}
                  </div>
                )}
                {!b.asset.issuer && (
                  <div style={{ fontSize: 11, color: "#4a7a9b" }}>Native Stellar Lumens</div>
                )}
              </div>
            </div>

            {/* Expanded panel */}
            {isOpen && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #1e3a55",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Details grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  {[
                    ["Balance", formatBalance(b.balance)],
                    b.limit ? ["Trustline Limit", formatBalance(b.limit)] : null,
                    b.buyingLiabilities ? ["Buying Liabilities", b.buyingLiabilities] : null,
                    b.sellingLiabilities ? ["Selling Liabilities", b.sellingLiabilities] : null,
                  ]
                    .filter(Boolean)
                    .map(([label, value]) => (
                      <div key={label as string}>
                        <div
                          style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "monospace" }}
                        >
                          {label}
                        </div>
                        <div style={{ fontSize: 12, color: "#b8dff0", fontWeight: 700 }}>
                          {value}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Actions */}
                {showActions && onAction && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["send", "swap", "info"] as const).map((action) => (
                      <button
                        key={action}
                        onClick={() => onAction(action, b)}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          background: "transparent",
                          border: "1px solid #1e3a55",
                          borderRadius: 6,
                          color: "#6ba3c0",
                          fontSize: 11,
                          cursor: "pointer",
                          textTransform: "capitalize",
                          fontWeight: 700,
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
