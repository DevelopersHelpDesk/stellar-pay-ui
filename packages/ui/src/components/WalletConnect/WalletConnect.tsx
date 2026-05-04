import React, { type CSSProperties } from "react";
import { useStellarWallet } from "../../hooks/useStellarWallet";
import type { WalletType } from "../../types";

// ─── Wallet options config ────────────────────────────────────────────────────

const WALLETS: Array<{ type: WalletType; label: string; description: string }> = [
  {
    type: "freighter",
    label: "Freighter",
    description: "Browser extension by Stellar Development Foundation",
  },
  {
    type: "albedo",
    label: "Albedo",
    description: "Web-based Stellar wallet — no extension needed",
  },
  {
    type: "xbull",
    label: "xBull",
    description: "Mobile and desktop multi-network wallet",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WalletConnectProps {
  /** Called once the wallet is successfully connected */
  onConnect?: (publicKey: string, walletType: WalletType) => void;
  /** Called when the user disconnects */
  onDisconnect?: () => void;
  /** Override which wallet options to display */
  wallets?: WalletType[];
  /** Tailwind or inline className for the root container */
  className?: string;
  style?: CSSProperties;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `WalletConnect` renders a wallet selection list and connected-state view.
 * It delegates authentication to the appropriate wallet adapter via the
 * `StellarPayProvider` context.
 *
 * @example
 * <WalletConnect onConnect={(key) => console.log(key)} />
 */
export function WalletConnect({
  onConnect,
  onDisconnect,
  wallets = ["freighter", "albedo", "xbull"],
  className,
  style,
}: WalletConnectProps) {
  const {
    connected,
    publicKey,
    walletType,
    connecting,
    error,
    connect,
    disconnect,
    shortKey,
  } = useStellarWallet();

  const handleConnect = async (type: WalletType) => {
    await connect(type);
    if (connected && publicKey) {
      onConnect?.(publicKey, type);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  const displayWallets = WALLETS.filter((w) => wallets.includes(w.type));

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}
      data-testid="wallet-connect"
    >
      {/* ── Not connected ─────────────────────────────────────────── */}
      {!connected && !connecting && (
        <>
          <p style={{ fontSize: 13, color: "#6ba3c0", marginBottom: 6 }}>
            Choose a Stellar wallet to connect
          </p>
          {displayWallets.map((w) => (
            <button
              key={w.type}
              onClick={() => handleConnect(w.type)}
              disabled={connecting}
              aria-label={`Connect with ${w.label}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "#0f1f2e",
                border: "1px solid #1e3a55",
                borderRadius: 10,
                cursor: "pointer",
                color: "#e8f4fb",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{w.label}</div>
                <div style={{ fontSize: 11, color: "#4a7a9b" }}>{w.description}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#4a7a9b" }}>→</span>
            </button>
          ))}
        </>
      )}

      {/* ── Connecting ────────────────────────────────────────────── */}
      {connecting && (
        <div
          style={{ textAlign: "center", padding: "24px 0" }}
          aria-live="polite"
          aria-busy
        >
          <div role="status" aria-label="Connecting to wallet">
            Connecting…
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            background: "#ff6b6b18",
            border: "1px solid #ff6b6b40",
            borderRadius: 8,
            color: "#ff6b6b",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Connected ─────────────────────────────────────────────── */}
      {connected && publicKey && !connecting && (
        <div
          style={{
            padding: 14,
            background: "#0f1f2e",
            border: "1px solid #10d07040",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#10d070",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ● Connected · {walletType}
            </span>
          </div>

          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: "#b8dff0",
              wordBreak: "break-all",
              marginBottom: 10,
            }}
            title={publicKey}
          >
            {shortKey}
          </div>

          <button
            onClick={handleDisconnect}
            style={{
              padding: "5px 12px",
              background: "transparent",
              border: "1px solid #ff6b6b40",
              borderRadius: 6,
              color: "#ff6b6b",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
