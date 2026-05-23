"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram, createStreamTx } from "@/lib/anchor/program";

export type CreateStreamParams = {
  recipient: string;
  mint: string;
  amount: number;
  decimals: number;
  startTime: number;
  cliffTime: number;
  endTime: number;
  cancelable: boolean;
};

export type TxStatus = "idle" | "signing" | "confirming" | "success" | "error";

export function useCreateStream() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");

  const create = async (params: CreateStreamParams) => {
    if (!wallet?.publicKey || !sendTransaction) {
      setError("Wallet not connected");
      return;
    }
    setStatus("signing");
    setError("");

    try {
      const program = getProgram(connection, wallet);
      const streamId = new BN(Date.now()); // unique stream ID
      const recipient = new PublicKey(params.recipient);
      const mint = new PublicKey(params.mint);
      const totalAmount = new BN(params.amount * Math.pow(10, params.decimals));

      const { tx, signers } = await createStreamTx(program, wallet.publicKey, {
        streamId,
        recipient,
        mint,
        totalAmount,
        startTime: new BN(params.startTime),
        cliffTime: new BN(params.cliffTime),
        endTime: new BN(params.endTime),
        cancelable: params.cancelable,
      });

      setStatus("confirming");
      const sig = await sendTransaction(tx, connection, { signers });
      await connection.confirmTransaction(sig, "confirmed");
      setSignature(sig);
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg);
      setStatus("error");
    }
  };

  const reset = () => { setStatus("idle"); setSignature(""); setError(""); };

  return { create, status, signature, error, reset };
}
