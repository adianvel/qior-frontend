"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, withdrawTx } from "@/lib/anchor/program";
import { useQueryClient } from "@tanstack/react-query";

export function useWithdraw() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "signing" | "confirming" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const withdraw = async (streamPDA: PublicKey, streamData: { mint: PublicKey; escrowTokenAccount: PublicKey; escrowBump: number }) => {
    if (!wallet?.publicKey || !sendTransaction) return;
    setStatus("signing");
    setError("");

    try {
      const program = getProgram(connection, wallet);
      const tx = await withdrawTx(program, wallet.publicKey, streamPDA, streamData);
      setStatus("confirming");
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setStatus("success");
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return { withdraw, status, error };
}
