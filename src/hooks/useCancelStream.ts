"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, cancelStreamTx } from "@/lib/anchor/program";
import { useQueryClient } from "@tanstack/react-query";
import { getTransactionErrorMessage, type TxStatus } from "@/lib/utils/transactions";

export function useCancelStream() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState("");

  const cancel = async (streamPDA: PublicKey, streamData: { recipient: PublicKey; mint: PublicKey; escrowTokenAccount: PublicKey }) => {
    if (!wallet?.publicKey || !sendTransaction) {
      setError("Wallet not connected");
      setStatus("error");
      return;
    }
    setStatus("preparing");
    setError("");

    try {
      const program = getProgram(connection, wallet);
      const tx = await cancelStreamTx(program, wallet.publicKey, streamPDA, streamData);
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
      setError(getTransactionErrorMessage(err, "Cancel failed"));
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return { cancel, status, error };
}
