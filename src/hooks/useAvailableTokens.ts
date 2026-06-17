"use client";

import { useMemo } from "react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { type ParsedAccountData } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { IS_MAINNET, SOLANA_CLUSTER } from "@/lib/env";

export const USDC_DEV_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
export const USDC_DEV_FAUCET_URL = "https://spl-token-faucet.com/?token-name=USDC-Dev";
export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
export const BASE_SOON_MINT = "base-soon";
export const IDRX_SOON_MINT = "idrx-soon";
export const USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export type TokenOption = {
  mint: string;
  symbol: string;
  name: string;
  decimals?: number;
  balanceRaw?: string;
  balanceLabel?: string;
  source: "wallet" | "curated" | "manual";
  disabled?: boolean;
  badge?: string;
};

type ParsedTokenInfo = {
  mint?: string;
  tokenAmount?: {
    amount?: string;
    decimals?: number;
  };
};

const curatedTokens: TokenOption[] = [
  {
    mint: WRAPPED_SOL_MINT,
    symbol: "SOL",
    name: "Wrapped SOL",
    decimals: 9,
    source: "curated",
  },
  {
    mint: USDC_DEV_MINT,
    symbol: "USDC-Dev",
    name: "USDC-Dev faucet token",
    decimals: 6,
    source: "curated",
    disabled: IS_MAINNET,
    badge: IS_MAINNET ? "Devnet" : undefined,
  },
  {
    mint: USDC_MAINNET_MINT,
    symbol: "USDC",
    name: "USDC mainnet",
    decimals: 6,
    source: "curated",
    disabled: !IS_MAINNET,
    badge: IS_MAINNET ? undefined : "Mainnet",
  },
  {
    mint: BASE_SOON_MINT,
    symbol: "Base",
    name: "Base support",
    source: "curated",
    disabled: true,
    badge: "Soon",
  },
  {
    mint: IDRX_SOON_MINT,
    symbol: "IDRX",
    name: "Indonesian Rupiah stablecoin",
    source: "curated",
    disabled: true,
    badge: "Soon",
  },
];

function isParsedAccountData(data: unknown): data is ParsedAccountData {
  return typeof data === "object" && data !== null && "parsed" in data;
}

function getTokenIdentity(mint: string) {
  if (mint === WRAPPED_SOL_MINT) {
    return { symbol: "SOL", name: "Wrapped SOL" };
  }

  if (mint === USDC_DEV_MINT) {
    return { symbol: "USDC-Dev", name: "USDC-Dev faucet token" };
  }

  if (mint === USDC_MAINNET_MINT) {
    return { symbol: "USDC", name: "USDC mainnet" };
  }

  if (mint === BASE_SOON_MINT) {
    return { symbol: "Base", name: "Base support" };
  }

  if (mint === IDRX_SOON_MINT) {
    return { symbol: "IDRX", name: "Indonesian Rupiah stablecoin" };
  }

  return { symbol: "SPL", name: "Wallet token" };
}

function formatBalance(amount: string, decimals: number) {
  try {
    const rawAmount = BigInt(amount);
    if (rawAmount === BigInt(0)) return "0";
    if (decimals <= 0) return rawAmount.toLocaleString("en-US");

    const visibleDecimals = Math.min(decimals, 2);
    const base = BigInt(10) ** BigInt(decimals);
    const displayBase = BigInt(10) ** BigInt(visibleDecimals);
    const roundingUnit = BigInt(10) ** BigInt(decimals - visibleDecimals);
    const whole = rawAmount / base;
    const fraction = rawAmount % base;
    let displayFraction = (fraction + roundingUnit / BigInt(2)) / roundingUnit;
    let displayWhole = whole;

    if (displayFraction >= displayBase) {
      displayWhole += BigInt(1);
      displayFraction = BigInt(0);
    }

    if (displayWhole === BigInt(0) && displayFraction === BigInt(0)) {
      return `<0.${"0".repeat(Math.max(visibleDecimals - 1, 0))}1`;
    }

    const fractionText = displayFraction
      .toString()
      .padStart(visibleDecimals, "0")
      .replace(/0+$/, "");

    return fractionText
      ? `${displayWhole.toLocaleString("en-US")}.${fractionText}`
      : displayWhole.toLocaleString("en-US");
  } catch {
    return undefined;
  }
}

export function useAvailableTokens() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const walletTokensQuery = useQuery({
    queryKey: ["available-tokens", SOLANA_CLUSTER, publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return [];

      const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokens = new Map<string, TokenOption>();

      for (const account of response.value) {
        const data = account.account.data;
        if (!isParsedAccountData(data)) continue;

        const info = data.parsed.info as ParsedTokenInfo;
        const mint = info.mint;
        const amount = info.tokenAmount?.amount ?? "0";
        const decimals = info.tokenAmount?.decimals ?? 0;

        if (!mint || BigInt(amount) <= BigInt(0)) continue;

        const identity = getTokenIdentity(mint);
        const existing = tokens.get(mint);
        const balanceRaw = existing?.balanceRaw
          ? (BigInt(existing.balanceRaw) + BigInt(amount)).toString()
          : amount;

        tokens.set(mint, {
          mint,
          ...identity,
          decimals,
          balanceRaw,
          balanceLabel: formatBalance(balanceRaw, decimals),
          source: "wallet",
        });
      }

    return Array.from(tokens.values()).sort((a, b) => {
      if (a.mint === WRAPPED_SOL_MINT) return -1;
      if (b.mint === WRAPPED_SOL_MINT) return 1;
      if (a.mint === USDC_MAINNET_MINT || a.mint === USDC_DEV_MINT) return -1;
      if (b.mint === USDC_MAINNET_MINT || b.mint === USDC_DEV_MINT) return 1;
      return a.symbol.localeCompare(b.symbol);
      });
    },
    enabled: !!publicKey,
  });

  const tokens = useMemo(() => {
    const merged = new Map<string, TokenOption>();

    for (const token of curatedTokens) {
      merged.set(token.mint, token);
    }

    for (const token of walletTokensQuery.data ?? []) {
      const curated = merged.get(token.mint);
      merged.set(token.mint, curated ? { ...curated, ...token, source: "wallet" } : token);
    }

    return Array.from(merged.values()).sort((a, b) => {
      if (a.source !== b.source) return a.source === "wallet" ? -1 : 1;
      if (a.mint === WRAPPED_SOL_MINT) return -1;
      if (b.mint === WRAPPED_SOL_MINT) return 1;
      if (a.mint === USDC_MAINNET_MINT || a.mint === USDC_DEV_MINT) return -1;
      if (b.mint === USDC_MAINNET_MINT || b.mint === USDC_DEV_MINT) return 1;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [walletTokensQuery.data]);

  return {
    tokens,
    isLoading: walletTokensQuery.isLoading,
    error: walletTokensQuery.error,
  };
}
