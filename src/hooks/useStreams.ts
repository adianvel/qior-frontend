"use client";

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { decodeStreamAccount, PROGRAM_ID } from "@/lib/anchor/program";
import type { StreamAccount } from "@/lib/anchor/types";

export function useStreams(role: "creator" | "recipient") {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useQuery<StreamAccount[]>({
    queryKey: ["streams", role, wallet?.publicKey?.toBase58()],
    queryFn: async () => {
      if (!wallet?.publicKey) return [];

      const offset = 8; // account discriminator
      const pubkeyOffset = role === "creator" ? offset : offset + 32;

      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          { memcmp: { offset: pubkeyOffset, bytes: wallet.publicKey.toBase58() } },
        ],
      });

      return accounts.map((acc) => decodeStreamAccount(acc.pubkey, acc.account.data));
    },
    enabled: !!wallet?.publicKey,
    placeholderData: [],
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
