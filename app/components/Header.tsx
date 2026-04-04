"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { INITIA_CHAIN_ID } from "../lib/contract";

type NavTab = "trade" | "bridge" | "history" | "docs";

interface HeaderProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

export function Header({ activeTab = "trade", onTabChange }: HeaderProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { username, openConnect, openWallet, openBridge, autoSign } =
    useInterwovenKit();
  const [copied, setCopied] = useState(false);


  const displayName =
    username ||
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "");

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isAutoSigning =
    autoSign?.isEnabledByChain?.[INITIA_CHAIN_ID] ?? false;

  const navItems: { id: NavTab; label: string }[] = [
    { id: "trade", label: "Trade" },
    { id: "bridge", label: "Bridge" },
    { id: "history", label: "History" },
    { id: "docs", label: "Docs" },
  ];

  const handleTabClick = (tab: NavTab) => {
    if (tab === "bridge") {
      openBridge({
        srcChainId: "initiation-2",
        srcDenom: "uinit",
        dstChainId: "mevshield-1",
        dstDenom: "uinit",
      });
      return;
    }
    if (tab === "docs") {
      window.open("https://docs.initia.xyz", "_blank");
      return;
    }
    onTabChange?.(tab);
  };

  return (
    <header className="border-b border-shield-border">
      {/* Top bar: Logo + Nav + Wallet */}
      <div className="flex items-center justify-between py-3 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-shield-accent/20 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-shield-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Batch<span className="text-shield-accent">Fi</span>
          </span>
        </div>

        {/* Navigation */}
        {isConnected && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 ease-out ${
                  activeTab === item.id
                    ? "text-shield-accent bg-shield-accent/10"
                    : "text-shield-muted hover:text-shield-text"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Wallet area */}
        <div className="flex items-center gap-2">
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              {isAutoSigning && (
                <span className="text-xs text-shield-accent bg-shield-accent/10 px-1.5 py-0.5 rounded hidden sm:inline">
                  Auto-Sign
                </span>
              )}
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 bg-shield-card border border-shield-border rounded-lg px-3 py-1.5 text-sm hover:border-shield-accent/30 transition-colors duration-150 ease-out"
                title="Click to copy address"
              >
                <div className="w-2 h-2 rounded-full bg-shield-accent" />
                <span className="font-mono text-xs">
                  {copied ? "Copied!" : displayName}
                </span>
              </button>
              <button
                onClick={openWallet}
                className="bg-shield-card border border-shield-border rounded-lg px-2 py-1.5 text-shield-muted hover:text-shield-accent hover:border-shield-accent/30 transition-colors duration-150 ease-out"
                title="Wallet"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </button>
              <button
                onClick={() => disconnect()}
                className="bg-shield-card border border-shield-border rounded-lg px-2 py-1.5 text-shield-muted hover:text-shield-red hover:border-shield-red/30 transition-colors duration-150 ease-out"
                title="Disconnect"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={openConnect}
              className="bg-shield-accent/10 text-shield-accent border border-shield-accent/30 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-shield-accent/20 transition-colors duration-150 ease-out"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

    </header>
  );
}
