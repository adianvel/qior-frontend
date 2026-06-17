"use client";

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import {
  decodeStreamAccount,
  LEGACY_STREAM_ACCOUNT_SIZE,
  PROGRAM_ID,
  recoverLegacyVestingMetadata,
} from "@/lib/anchor/program";
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

      return Promise.all(accounts.map(async (acc) => {
        const stream = decodeStreamAccount(acc.pubkey, acc.account.data);

        if (acc.account.data.length === LEGACY_STREAM_ACCOUNT_SIZE) {
          const recoveredVestingMetadata = await recoverLegacyVestingMetadata(connection, acc.pubkey);
          if (recoveredVestingMetadata) {
            stream.vestingType = recoveredVestingMetadata.vestingType;
            stream.milestoneTime = recoveredVestingMetadata.milestoneTime;
            stream.vestingTypeSource = "createTransaction";
          }
        }

        return stream;
      }));
    },
    enabled: !!wallet?.publicKey,
    placeholderData: [],
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
