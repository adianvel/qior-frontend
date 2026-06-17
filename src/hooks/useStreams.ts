"use client";

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  decodeStreamAccount,
  getCachedLegacyVestingMetadata,
  LEGACY_STREAM_ACCOUNT_SIZE,
  PROGRAM_ID,
  recoverLegacyVestingMetadata,
} from "@/lib/anchor/program";
import type { StreamAccount } from "@/lib/anchor/types";

export function useStreams(role: "creator" | "recipient") {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const queryKey = ["streams", role, wallet?.publicKey?.toBase58()];

  return useQuery<StreamAccount[]>({
    queryKey,
    queryFn: async () => {
      if (!wallet?.publicKey) return [];

      const offset = 8; // account discriminator
      const pubkeyOffset = role === "creator" ? offset : offset + 32;

      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          { memcmp: { offset: pubkeyOffset, bytes: wallet.publicKey.toBase58() } },
        ],
      });

      return accounts.map((acc) => {
        const stream = decodeStreamAccount(acc.pubkey, acc.account.data);

        if (acc.account.data.length === LEGACY_STREAM_ACCOUNT_SIZE) {
          const cachedVestingMetadata = getCachedLegacyVestingMetadata(acc.pubkey);
          if (cachedVestingMetadata) {
            stream.vestingType = cachedVestingMetadata.vestingType;
            stream.milestoneTime = cachedVestingMetadata.milestoneTime;
            stream.vestingTypeSource = "createTransaction";
          } else {
            void recoverLegacyVestingMetadata(connection, acc.pubkey)
              .then((recoveredVestingMetadata) => {
                if (!recoveredVestingMetadata) return;

                queryClient.setQueryData<StreamAccount[]>(queryKey, (currentStreams) => {
                  if (!currentStreams) return currentStreams;

                  return currentStreams.map((currentStream) => {
                    if (!currentStream.publicKey.equals(acc.pubkey)) return currentStream;

                    return {
                      ...currentStream,
                      vestingType: recoveredVestingMetadata.vestingType,
                      milestoneTime: recoveredVestingMetadata.milestoneTime,
                      vestingTypeSource: "createTransaction",
                    };
                  });
                });
              })
              .catch(() => {
                // Legacy recovery is best-effort and should not block dashboard rendering.
              });
          }
        }

        return stream;
      });
    },
    enabled: !!wallet?.publicKey,
    placeholderData: [],
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
