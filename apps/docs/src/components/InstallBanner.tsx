"use client";

import React, { useState } from "react";

const COMMANDS = [
  { label: "npm", cmd: "npm install @stellar-pay/ui stellar-sdk" },
  { label: "pnpm", cmd: "pnpm add @stellar-pay/ui stellar-sdk" },
  { label: "yarn", cmd: "yarn add @stellar-pay/ui stellar-sdk" },
];

export function InstallBanner() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(COMMANDS[active].cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      style={{
        background: "#050d14",
        border: "1px solid #1e3a55",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #1e3a55",
          padding: "0 16px",
        }}
      >
        {COMMANDS.map((c, i) => (
          <button
            key={c.label}
            onClick={() => setActive(i)}
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${i === active ? "#8dc8e0" : "transparent"}`,
              color: i === active ? "#8dc8e0" : "#4a7a9b",
              fontSize: 11,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              transition: "color 0.2s",
              marginBottom: -1,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Command row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          gap: 12,
        }}
      >
        <code
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            color: "#8dc8e0",
          }}
        >
          $ {COMMANDS[active].cmd}
        </code>
        <button
          onClick={copy}
          style={{
            padding: "5px 14px",
            background: "transparent",
            border: "1px solid #1e3a55",
            borderRadius: 6,
            color: "#6ba3c0",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'Space Mono', monospace",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
