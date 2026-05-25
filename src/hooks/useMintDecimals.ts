"use client";

import { useMemo } from "react";
import { getMint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";

export function useMintDecimals(mints: Array<PublicKey | undefined>) {
  const { connection } = useConnection();
  const mintAddresses = useMemo(
    () => Array.from(new Set(mints.filter(Boolean).map((mint) => mint!.toBase58()))).sort(),
    [mints]
  );

  return useQuery<Record<string, number>>({
    queryKey: ["mint-decimals", mintAddresses],
    queryFn: async () => {
      const entries = await Promise.all(
        mintAddresses.map(async (address) => {
          const mint = await getMint(connection, new PublicKey(address));
          return [address, mint.decimals] as const;
        })
      );

      return Object.fromEntries(entries);
    },
    enabled: mintAddresses.length > 0,
    placeholderData: {},
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

