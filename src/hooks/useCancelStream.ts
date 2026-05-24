"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, cancelStreamTx } from "@/lib/anchor/program";
import { useQueryClient } from "@tanstack/react-query";

export function useCancelStream() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "signing" | "confirming" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const cancel = async (streamPDA: PublicKey, streamData: { recipient: PublicKey; mint: PublicKey; escrowTokenAccount: PublicKey }) => {
    if (!wallet?.publicKey || !sendTransaction) return;
    setStatus("signing");
    setError("");

    try {
      const program = getProgram(connection, wallet);
      const tx = await cancelStreamTx(program, wallet.publicKey, streamPDA, streamData);
      setStatus("confirming");
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setStatus("success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["streams"], refetchType: "active" }),
        queryClient.invalidateQueries({ queryKey: ["stream"], refetchType: "active" }),
      ]);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Cancel failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return { cancel, status, error };
}
