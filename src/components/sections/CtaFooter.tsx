"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M13.74 10.62 20.54 3h-1.61l-5.91 6.62L8.3 3H2.86l7.13 10-7.13 8h1.61l6.24-7 4.99 7h5.44l-7.4-10.38Zm-2.21 2.47-.72-1.01-5.75-7.87h2.47l4.64 6.36.72 1.01 6.04 8.27h-2.47l-4.93-6.76Z"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.95 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      />
    </svg>
  );
}

export function CtaFooter() {
  return (
    <>
      <section className="relative flex min-h-[86dvh] items-center justify-center overflow-hidden bg-white px-6 py-28 text-center md:px-10 md:py-36">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-[radial-gradient(ellipse_at_18%_100%,rgba(124,58,237,0.5)_0%,rgba(167,139,250,0.34)_28%,transparent_56%),radial-gradient(ellipse_at_74%_92%,rgba(109,40,217,0.36)_0%,rgba(196,181,253,0.34)_34%,transparent_64%)]" />
        <div className="pointer-events-none absolute inset-x-[-10%] bottom-[-28%] h-[62%] bg-[radial-gradient(ellipse_at_42%_58%,rgba(255,255,255,0.78),transparent_58%),radial-gradient(ellipse_at_62%_76%,rgba(124,58,237,0.34),transparent_58%)] blur-[38px]" />

        <div className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[clamp(44px,5vw,72px)] font-medium leading-[1.04] tracking-normal text-black"
          >
            Launch Qior today
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 max-w-[680px] text-lg leading-relaxed text-black md:text-[22px]"
          >
            Lock, vest, and distribute Solana tokens with transparent on-chain schedules your team can trust.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-10"
          >
            <Link
              href="/dashboard/creator"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-900 active:scale-[0.97]"
            >
              Launch App <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div className="max-w-sm">
            <Image src="/logo-qior.avif" alt="Qior" width={120} height={40} className="h-16 w-auto" />
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-4">
            <div>
              <h3 className="font-semibold text-zinc-900">Product</h3>
              <div className="mt-4 flex flex-col gap-3 text-zinc-500">
                <a href="#features" className="transition-colors hover:text-zinc-900">Features</a>
                <a href="#how-it-works" className="transition-colors hover:text-zinc-900">How it works</a>
                <Link href="/dashboard/creator" className="transition-colors hover:text-zinc-900">Creator dashboard</Link>
                <Link href="/dashboard/recipient" className="transition-colors hover:text-zinc-900">Recipient dashboard</Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900">Developers</h3>
              <div className="mt-4 flex flex-col gap-3 text-zinc-500">
                <a href="#developers" className="transition-colors hover:text-zinc-900">Integration</a>
                <a
                  href="https://github.com/mancer-team2/programs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-zinc-900"
                >
                  Smart contract
                </a>
                <Link href="/create" className="transition-colors hover:text-zinc-900">Create stream</Link>
                <a href="#use-cases" className="transition-colors hover:text-zinc-900">Use cases</a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900">Resources</h3>
              <div className="mt-4 flex flex-col gap-3 text-zinc-500">
                <a
                  href="https://github.com/mancer-team2/frontend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-zinc-900"
                >
                  Repository
                </a>
                <a
                  href="https://spl-token-faucet.com/?token-name=USDC-Dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-zinc-900"
                >
                  USDC-Dev faucet
                </a>
                <a
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-zinc-900"
                >
                  Solana Explorer
                </a>
                <a href="#" className="transition-colors hover:text-zinc-900">Support</a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900">Company</h3>
              <div className="mt-4 flex flex-col gap-3 text-zinc-500">
                <a href="#" className="transition-colors hover:text-zinc-900">About</a>
                <a href="#" className="transition-colors hover:text-zinc-900">Security</a>
                <a href="#" className="transition-colors hover:text-zinc-900">Privacy</a>
                <a href="#" className="transition-colors hover:text-zinc-900">Terms</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-[1400px] flex-col items-center justify-between gap-5 border-t border-zinc-200 pt-6 sm:flex-row">
          <span className="text-xs text-zinc-400">&copy; 2026  Qior Labs, Inc. All rights reserved.</span>

          <div className="flex items-center gap-6 text-zinc-900">
            <a
              href="https://x.com/useqior"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Qior on X"
              className="inline-flex min-h-10 min-w-10 items-center justify-center transition-colors hover:text-violet-700"
            >
              <XIcon className="h-8 w-8" />
            </a>
            <a
              href="https://www.instagram.com/useqior/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Qior on Instagram"
              className="inline-flex min-h-10 min-w-10 items-center justify-center transition-colors hover:text-violet-700"
            >
              <InstagramIcon className="h-8 w-8" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
