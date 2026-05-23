"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { House, PlusCircle, Stack, Wallet, SignOut } from "@phosphor-icons/react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const navItems = [
  { href: "/dashboard/creator", label: "My Streams", icon: Stack },
  { href: "/dashboard/recipient", label: "Incoming", icon: Wallet },
  { href: "/create", label: "Create Stream", icon: PlusCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { connected, disconnect } = useWallet();

  return (
    <div className="flex min-h-[100dvh] bg-[#f8f8fa]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-zinc-200 bg-white py-6 px-4">
        <Link href="/" className="text-lg font-bold text-zinc-900 px-3 mb-8">
          Qior
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-violet-50 text-violet-600 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <item.icon size={18} weight={active ? "fill" : "regular"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 px-3">
          <button
            onClick={() => { disconnect(); window.location.href = "/"; }}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <SignOut size={14} weight="bold" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/" className="text-lg font-bold text-zinc-900">Qior</Link>
          </div>
          <div className="hidden md:block" />
          <WalletMultiButton className="!bg-violet-600 !hover:bg-violet-500 !rounded-lg !h-9 !text-sm !font-medium" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">
          {!connected ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
              <House size={48} weight="duotone" className="text-zinc-300" />
              <h2 className="text-xl font-semibold text-zinc-900">Connect your wallet</h2>
              <p className="text-sm text-zinc-500 text-center max-w-sm">
                Connect a Solana wallet to create streams, view incoming tokens, and manage your distributions.
              </p>
              <WalletMultiButton className="!bg-violet-600 !rounded-lg !h-10 !text-sm !font-medium mt-2" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
