"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { CHAIN_ID, minitia } from "../lib/contract";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [showDemo, setShowDemo] = useState(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);

  // Check the WALLET's actual chain (not wagmi's configured chain)
  useEffect(() => {
    if (!isConnected || !connector) return;
    connector.getProvider?.().then((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = p as any;
      if (provider?.request) {
        provider.request({ method: "eth_chainId" }).then((id: string) => {
          setWalletChainId(parseInt(id as string, 16));
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [isConnected, connector]);

  // Auto-add and switch to correct network when wallet is on wrong chain
  const addAndSwitch = useCallback(async () => {
    if (!connector) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = (await connector.getProvider?.()) as any;
      if (!provider?.request) {
        switchChain({ chainId: CHAIN_ID });
        return;
      }
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: `0x${CHAIN_ID.toString(16)}`,
          chainName: minitia.name,
          nativeCurrency: minitia.nativeCurrency,
          rpcUrls: [minitia.rpcUrls.default.http[0]],
        }],
      });
      setWalletChainId(CHAIN_ID);
    } catch (e) {
      // Fallback to wagmi switchChain
      switchChain({ chainId: CHAIN_ID });
    }
  }, [connector, switchChain]);

  // Auto-trigger on connect if wallet is on wrong chain
  useEffect(() => {
    if (isConnected && walletChainId !== null && walletChainId !== CHAIN_ID) {
      addAndSwitch();
    }
  }, [isConnected, walletChainId, addAndSwitch]);

  if (!isConnected) return <>{children}</>;

  // If wallet is confirmed on wrong chain, show the guard
  if (walletChainId !== null && walletChainId !== CHAIN_ID && !showDemo) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 gap-6">
        <div className="bg-shield-card border border-shield-border rounded-lg p-6 max-w-lg text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-shield-accent/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-shield-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Switch to BatchFi Network</h3>
          <p className="text-sm text-shield-muted leading-relaxed">
            Your wallet is connected to the wrong network. BatchFi runs on its own Initia
            MiniEVM rollup. Click below to add and switch to the correct chain.
          </p>
          <div className="flex gap-3">
            <button
              onClick={addAndSwitch}
              disabled={isPending}
              className="flex-1 py-2.5 bg-shield-accent text-shield-bg rounded-lg text-sm font-medium hover:bg-shield-accent/90 transition-colors duration-150 ease-out disabled:opacity-50"
            >
              {isPending ? "Switching..." : "Switch Network"}
            </button>
            <button
              onClick={() => setShowDemo(true)}
              className="flex-1 py-2.5 bg-shield-card text-shield-text border border-shield-border rounded-lg text-sm font-medium hover:bg-shield-bg transition-colors duration-150 ease-out"
            >
              Preview UI
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
