"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ChevronDown, LoaderCircle, LogOut, RefreshCw, Wallet } from "lucide-react";
import { shortenAddress } from "@/lib/utils/format";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { publicKey, connected, connecting, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (connected && publicKey) {
    return (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-100 active:scale-[0.98]"
        >
          {wallet?.adapter.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wallet.adapter.icon} alt="" className="h-5 w-5 rounded-full" />
          ) : (
            <Wallet size={16} />
          )}
          <span>{shortenAddress(publicKey, compact ? 4 : 5)}</span>
          <ChevronDown size={14} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_20px_60px_rgba(24,24,27,0.16)]">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setVisible(true);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 transition-colors hover:bg-violet-50 hover:text-violet-700"
            >
              <RefreshCw size={15} />
              Change wallet
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                disconnect();
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={15} />
              Disconnect
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      disabled={connecting}
      className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
    >
      {connecting ? <LoaderCircle size={16} className="animate-spin" /> : <Wallet size={16} />}
      <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
    </button>
  );
}
