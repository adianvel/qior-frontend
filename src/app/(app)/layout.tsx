"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { CirclePlus, Layers, LockKeyhole, LogOut, Wallet } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";

const navItems = [
  { href: "/dashboard/creator", label: "My Streams", icon: Layers },
  { href: "/dashboard/recipient", label: "Incoming", icon: Wallet },
  { href: "/create", label: "Create Stream", icon: CirclePlus },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { connected, disconnect } = useWallet();
  const [contentScrolled, setContentScrolled] = useState(false);
  const contentScrolledRef = useRef(false);

  const handleContentScroll = (event: React.UIEvent<HTMLElement>) => {
    const nextScrolled = event.currentTarget.scrollTop > 8;
    if (contentScrolledRef.current === nextScrolled) return;

    contentScrolledRef.current = nextScrolled;
    setContentScrolled(nextScrolled);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f3f2f6] text-zinc-950">
      <aside className="hidden h-[100dvh] w-[268px] shrink-0 overflow-hidden border-r border-zinc-200/80 bg-white px-4 py-4 shadow-[1px_0_0_rgba(24,24,27,0.03)] md:flex md:flex-col">
        <Link href="/" className="mb-5 flex h-10 items-center gap-3 rounded-2xl px-3">
          <Image src="/logo-qior.avif" alt="Qior" width={82} height={28} className="h-7 w-auto" priority />
          <span className="text-lg font-semibold tracking-tight text-zinc-950">Qior</span>
        </Link>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  active ? "bg-zinc-200 text-zinc-950" : "bg-white text-zinc-500 shadow-[inset_0_0_0_1px_rgba(24,24,27,0.08)] group-hover:text-zinc-950"
                }`}>
                  <item.icon size={17} strokeWidth={active ? 2.35 : 1.9} />
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-3">
          <button
            onClick={() => { disconnect(); window.location.href = "/"; }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:border-red-200 hover:text-red-500"
          >
            <LogOut size={14} strokeWidth={2.25} />
            Log out
          </button>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className={`absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b px-5 py-3.5 transition-colors duration-200 md:px-8 ${
          contentScrolled
            ? "border-zinc-200/60 bg-white/72 shadow-[0_10px_28px_rgba(24,24,27,0.06)] backdrop-blur-sm"
            : "border-zinc-200/80 bg-white/82"
        }`}>
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/" className="flex items-center">
              <Image src="/logo-qior.avif" alt="Qior" width={72} height={24} className="h-6 w-auto" />
              <span className="ml-2 text-lg font-semibold tracking-tight text-zinc-950">Qior</span>
            </Link>
          </div>
          <div className="hidden text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 md:block">Secure token vesting</div>
          <WalletButton />
        </header>

        <main
          onScroll={handleContentScroll}
          className="flex-1 overflow-y-auto p-4 pb-28 pt-24 md:p-8 md:pt-28"
        >
          {!connected ? (
            <div className="mx-auto flex min-h-[64vh] max-w-lg flex-col items-center justify-center gap-4 rounded-[32px] border border-zinc-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600 text-white">
                <div className="absolute left-4 top-4 h-5 w-5 rounded-full border-2 border-white/90" />
                <div className="absolute bottom-4 right-4 h-5 w-5 rounded-full border-2 border-white/60" />
                <div className="absolute left-7 top-7 h-px w-5 rotate-45 bg-white/70" />
                <LockKeyhole size={24} strokeWidth={1.9} className="relative" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Connect your wallet</h2>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
                Connect a Solana wallet to create streams, view incoming tokens, and manage your distributions.
              </p>
              <WalletButton />
            </div>
          ) : (
            children
          )}
        </main>

        {connected ? (
          <nav className="absolute inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-1 rounded-[24px] border border-zinc-200/80 bg-white/94 p-1.5 shadow-[0_12px_36px_rgba(24,24,27,0.12)] backdrop-blur-sm md:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  <item.icon size={17} strokeWidth={active ? 2.4 : 2} />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
