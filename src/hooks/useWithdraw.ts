"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, withdrawTx } from "@/lib/anchor/program";
import { useQueryClient } from "@tanstack/react-query";
import { getTransactionErrorMessage, type TxStatus } from "@/lib/utils/transactions";

export function useWithdraw() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState("");

  const withdraw = async (streamPDA: PublicKey, streamData: { mint: PublicKey; escrowTokenAccount: PublicKey; escrowBump: number }) => {
    if (!wallet?.publicKey || !sendTransaction) {
      setError("Wallet not connected");
      setStatus("error");
      return;
    }
    setStatus("preparing");
    setError("");

    try {
      const program = getProgram(connection, wallet);
      const tx = await withdrawTx(program, wallet.publicKey, streamPDA, streamData);
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
      setError(getTransactionErrorMessage(err, "Withdraw failed"));
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return { withdraw, status, error };
}
