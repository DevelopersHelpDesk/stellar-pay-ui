import React, { useState, type CSSProperties } from "react";
import { useSingleUseWallet } from "../../hooks/useSingleUseWallet";
import type { SingleUseWalletConfig, StellarAsset } from "../../types";

const USDC: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

export interface SingleUseWalletProps {
  /** Default config values to pre-fill the form */
  defaultConfig?: Partial<SingleUseWalletConfig>;
  /** Called when a wallet is generated */
  onGenerate?: (publicKey: string) => void;
  /** Called when a wallet is revoked */
  onRevoke?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * `SingleUseWallet` surfaces the SDP on-demand wallet generation flow.
 * Uses `useSingleUseWallet` internally.
 *
 * The generated secret key is held in React state only —
 * it is never written to localStorage or sessionStorage.
 *
 * @example
 * <SingleUseWallet
 *   defaultConfig={{ purpose: "invoice-1042", expiresInSeconds: 1800 }}
 *   onGenerate={(pubKey) => console.log("share this address:", pubKey)}
 * />
 */
export function SingleUseWallet({
  defaultConfig,
  onGenerate,
  onRevoke,
  className,
  style,
}: SingleUseWalletProps) {
  const { wallet, generating, error, isExpired, generate, revoke } =
    useSingleUseWallet();

  const [purpose, setPurpose] = useState(defaultConfig?.purpose ?? "");
  const [expirySecs, setExpirySecs] = useState(
    defaultConfig?.expiresInSeconds ?? 1800
  );
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState<"address" | "secret" | null>(null);

  const handleGenerate = async () => {
    const config: SingleUseWalletConfig = {
      purpose,
      expiresInSeconds: expirySecs,
      expectedAsset: defaultConfig?.expectedAsset ?? USDC,
      autoRevoke: true,
    };
    const result = await generate(config);
    if (result) onGenerate?.(result.publicKey);
  };

  const handleRevoke = () => {
    revoke();
    onRevoke?.();
  };

  const copyTo = (text: string, field: "address" | "secret") => {
    navigator.clipboard?.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1800);
  };

  const ttlMinutes = Math.round(expirySecs / 60);

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    background: "#050d14",
    border: "1px solid #1e3a55",
    borderRadius: 7,
    color: "#e8f4fb",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 12, ...style }}
      data-testid="single-use-wallet"
    >
      {/* Info callout */}
      <div
        style={{
          padding: "10px 12px",
          background: "#f0b42910",
          border: "1px solid #f0b42930",
          borderRadius: 8,
          fontSize: 12,
          color: "#b8dff0",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#f0b429" }}>SDP Feature — </strong>
        On-demand wallets for single-use payment collection. The keypair is
        generated client-side and held in memory only.
      </div>

      {/* No wallet yet — show config form */}
      {!wallet && !generating && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "#4a7a9b",
                fontFamily: "monospace",
                letterSpacing: "0.06em",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Purpose / Reference
            </label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="invoice-1042, user-abc…"
              style={inputStyle}
              aria-label="Wallet purpose"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "#4a7a9b",
                fontFamily: "monospace",
                letterSpacing: "0.06em",
                marginBottom: 5,
                textTransform: "uppercase",
              }}
            >
              Expires In — {ttlMinutes} min
            </label>
            <input
              type="range"
              min={300}
              max={86400}
              step={300}
              value={expirySecs}
              onChange={(e) => setExpirySecs(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#8dc8e0" }}
              aria-label={`Wallet expiry: ${ttlMinutes} minutes`}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#2a4a68",
                fontFamily: "monospace",
              }}
            >
              <span>5 min</span>
              <span>24 hr</span>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ color: "#ff6b6b", fontSize: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: "11px 0",
              background: "linear-gradient(135deg, #f0b42922, #8dc8e022)",
              border: "1px solid #f0b42950",
              borderRadius: 8,
              color: "#b8dff0",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Generate Wallet →
          </button>
        </div>
      )}

      {/* Generating spinner */}
      {generating && (
        <div
          aria-live="polite"
          aria-busy
          style={{ textAlign: "center", padding: "20px 0", color: "#4a7a9b", fontSize: 13 }}
        >
          Deriving keypair…
        </div>
      )}

      {/* Wallet ready */}
      {wallet && !generating && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 11,
                color: isExpired ? "#ff6b6b" : "#10d070",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ● {isExpired ? "Expired" : `Active — expires in ${ttlMinutes}m`}
            </span>
            <span style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "monospace" }}>
              {wallet.purpose}
            </span>
          </div>

          {/* Public key */}
          <div
            style={{
              padding: "10px 12px",
              background: "#050d14",
              border: "1px solid #1e3a55",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 10, color: "#4a7a9b", fontFamily: "monospace", marginBottom: 4, textTransform: "uppercase" }}>
              Public Address
            </div>
            <div
              style={{ fontFamily: "monospace", fontSize: 11, color: "#b8dff0", wordBreak: "break-all" }}
            >
              {wallet.publicKey}
            </div>
            <button
              onClick={() => copyTo(wallet.publicKey, "address")}
              style={{
                marginTop: 6,
                padding: "4px 10px",
                background: "transparent",
                border: "1px solid #1e3a55",
                borderRadius: 5,
                color: "#6ba3c0",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {copied === "address" ? "✓ Copied" : "Copy Address"}
            </button>
          </div>

          {/* Secret key — blurred by default */}
          <div
            style={{
              padding: "10px 12px",
              background: "#050d14",
              border: "1px solid #ff6b6b30",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 10, color: "#ff6b6b", fontFamily: "monospace", marginBottom: 4, textTransform: "uppercase" }}>
              ⚠ Private Key — never share this
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "#e84b7a",
                wordBreak: "break-all",
                filter: secretVisible ? "none" : "blur(5px)",
                transition: "filter 0.2s",
                cursor: "pointer",
                userSelect: secretVisible ? "text" : "none",
              }}
              onClick={() => setSecretVisible((v) => !v)}
              title={secretVisible ? "Click to hide" : "Click to reveal"}
              aria-label="Private key — click to toggle visibility"
            >
              {wallet.secretKey}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={() => setSecretVisible((v) => !v)}
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  border: "1px solid #ff6b6b30",
                  borderRadius: 5,
                  color: "#e84b7a",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {secretVisible ? "Hide" : "Reveal"}
              </button>
              {secretVisible && (
                <button
                  onClick={() => copyTo(wallet.secretKey, "secret")}
                  style={{
                    padding: "4px 10px",
                    background: "transparent",
                    border: "1px solid #ff6b6b30",
                    borderRadius: 5,
                    color: "#e84b7a",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {copied === "secret" ? "✓ Copied" : "Copy Secret"}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleRevoke}
            style={{
              padding: "9px 0",
              background: "transparent",
              border: "1px solid #ff6b6b40",
              borderRadius: 8,
              color: "#ff6b6b",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Revoke Wallet
          </button>
        </div>
      )}
    </div>
  );
}
