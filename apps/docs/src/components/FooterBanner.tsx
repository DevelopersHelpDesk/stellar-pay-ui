"use client";

import React from "react";

const LINKS = [
  { label: "GitHub", href: "https://github.com/YOUR_ORG/stellar-pay-ui" },
  { label: "npm", href: "https://npmjs.com/package/@stellar-pay/ui" },
  { label: "Stellar Docs", href: "https://developers.stellar.org" },
  { label: "SDP Docs", href: "https://developers.stellar.org/docs/disbursement" },
  { label: "Drips Wave", href: "https://drips.network" },
];

export function FooterBanner() {
  return (
    <footer>
      {/* Wave Program callout */}
      <div
        style={{
          padding: "16px 20px",
          background: "#050d14",
          border: "1px solid #1e3a55",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: "#e8f4fb",
              marginBottom: 3,
            }}
          >
            Built for the Drips Network Wave Program
          </div>
          <div style={{ color: "#4a7a9b", fontSize: 12 }}>
            Composable infrastructure — reusable across all Wave repos as a
            peer dependency
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Wave Ready", color: "#f0b429" },
            { label: "MIT License", color: "#8dc8e0" },
            { label: "Testnet · Mainnet", color: "#10d070" },
          ].map(({ label, color }) => (
            <span
              key={label}
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 99,
                background: color + "18",
                border: `1px solid ${color}35`,
                color,
                fontSize: 11,
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Links + copyright */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#4a7a9b",
                fontSize: 12,
                textDecoration: "none",
                fontFamily: "'Space Mono', monospace",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#8dc8e0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#4a7a9b")
              }
            >
              {l.label}
            </a>
          ))}
        </div>

        <span
          style={{
            fontSize: 11,
            color: "#2a4a68",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          @stellar-pay/ui · MIT
        </span>
      </div>
    </footer>
  );
}
