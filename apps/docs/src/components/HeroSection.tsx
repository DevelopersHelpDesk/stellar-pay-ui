"use client";

import React from "react";

const TAGS = [
  "stellar-sdk",
  "soroban-ready",
  "typescript",
  "tree-shakeable",
  "SDP-compatible",
  "MIT",
];

export function HeroSection() {
  return (
    <header
      style={{
        borderBottom: "1px solid #1e3a55",
        padding: "36px 0 28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 120% at 50% -10%, #8dc8e014 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div
            aria-hidden
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #8dc8e0, #10d070)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "#020408",
              fontWeight: 900,
              animation: "float 4s ease-in-out infinite",
              flexShrink: 0,
            }}
          >
            ✦
          </div>

          <div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 900,
                fontSize: 28,
                letterSpacing: "-0.03em",
                color: "#e8f4fb",
                lineHeight: 1,
              }}
            >
              stellar-pay-ui
            </h1>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: "#4a7a9b",
                marginTop: 3,
              }}
            >
              @stellar-pay/ui · v0.1.0-alpha
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 99,
                background: "#10d07018",
                border: "1px solid #10d07035",
                color: "#10d070",
                fontSize: 11,
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.06em",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#10d070",
                  animation: "glow-pulse 2s ease-in-out infinite",
                }}
              />
              Live Demo
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            color: "#6ba3c0",
            fontSize: 14,
            lineHeight: 1.7,
            maxWidth: 580,
            marginBottom: 18,
          }}
        >
          Production-grade React components for Stellar dApps — wallet connect,
          transaction flows, asset balance display, and enterprise disbursements.
          All wired to the Stellar JS SDK. Think{" "}
          <span style={{ color: "#b8dff0" }}>shadcn/ui</span>, but for the
          Stellar ecosystem.
        </p>

        {/* Tag strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TAGS.map((t) => (
            <span
              key={t}
              style={{
                display: "inline-block",
                padding: "2px 8px",
                background: "#0f1f2e",
                border: "1px solid #1e3a55",
                color: "#4a7a9b",
                fontSize: 10,
                fontFamily: "'Space Mono', monospace",
                borderRadius: 3,
                letterSpacing: "0.04em",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
