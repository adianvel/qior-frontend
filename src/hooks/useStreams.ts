"use client";

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { getProgram, PROGRAM_ID } from "@/lib/anchor/program";
import type { StreamAccount } from "@/lib/anchor/types";

export function useStreams(role: "creator" | "recipient") {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useQuery<StreamAccount[]>({
    queryKey: ["streams", role, wallet?.publicKey?.toBase58()],
    queryFn: async () => {
      if (!wallet?.publicKey) return [];
      const program = getProgram(connection, wallet);

      const offset = 8; // account discriminator
      const pubkeyOffset = role === "creator" ? offset : offset + 32;

      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          { memcmp: { offset: pubkeyOffset, bytes: wallet.publicKey.toBase58() } },
        ],
      });

      return accounts.map((acc) => {
        const decoded = program.coder.accounts.decode("stream", acc.account.data);
        return {
          publicKey: acc.pubkey,
          creator: decoded.creator,
          recipient: decoded.recipient,
          mint: decoded.mint,
          escrowTokenAccount: decoded.escrowTokenAccount,
          streamId: decoded.streamId?.toNumber?.() ?? 0,
          totalAmount: decoded.totalAmount?.toNumber?.() ?? 0,
          withdrawnAmount: decoded.withdrawnAmount?.toNumber?.() ?? 0,
          startTime: decoded.startTime?.toNumber?.() ?? 0,
          cliffTime: decoded.cliffTime?.toNumber?.() ?? 0,
          endTime: decoded.endTime?.toNumber?.() ?? 0,
          cancelable: decoded.cancelable,
          canceled: decoded.canceled,
          milestoneBased: decoded.milestoneBased,
          milestoneReached: decoded.milestoneReached,
          bump: decoded.bump,
          escrowBump: decoded.escrowBump,
        } as StreamAccount;
      });
    },
    enabled: !!wallet?.publicKey,
    placeholderData: [],
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
