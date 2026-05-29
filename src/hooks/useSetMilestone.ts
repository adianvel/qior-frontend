"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { getProgram, setMilestoneTx } from "@/lib/anchor/program";
import { getTransactionErrorMessage, type TxStatus } from "@/lib/utils/transactions";

export function useSetMilestone() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState("");

  const setMilestone = async (streamPDA: PublicKey) => {
    if (!wallet?.publicKey || !sendTransaction) {
      setError("Wallet not connected");
      setStatus("error");
      return;
    }

    setStatus("preparing");
    setError("");

    try {
      const program = getProgram(connection, wallet);
      const tx = await setMilestoneTx(program, wallet.publicKey, streamPDA);
      setStatus("awaiting_signature");
      const sig = await sendTransaction(tx, connection);
      setStatus("confirming");
      await connection.confirmTransaction(sig, "confirmed");
      setStatus("success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["streams"] }),
        queryClient.invalidateQueries({ queryKey: ["stream"] }),
      ]);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: unknown) {
      setError(getTransactionErrorMessage(err, "Milestone update failed"));
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return { setMilestone, status, error };
}
