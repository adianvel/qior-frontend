"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getMint } from "@solana/spl-token";
import { useQueryClient } from "@tanstack/react-query";
import { getProgram, createStreamTx } from "@/lib/anchor/program";
import { toRawTokenAmount } from "@/lib/utils/format";
import { getTransactionErrorMessage, type TxStatus } from "@/lib/utils/transactions";

export type CreateStreamParams = {
  recipient: string;
  mint: string;
  amount: string;
  startTime: number;
  cliffTime: number;
  endTime: number;
  cancelable: boolean;
};

function withTimeout<T>(promise: Promise<T>, message: string, ms = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), ms);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export function useCreateStream() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");

  const create = async (params: CreateStreamParams) => {
    if (!wallet?.publicKey || !sendTransaction) {
      setError("Wallet not connected");
      return;
    }
    setStatus("preparing");
    setError("");

    try {
      const program = getProgram(connection, wallet);
      const streamId = new BN(Date.now()); // unique stream ID
      const recipient = new PublicKey(params.recipient);
      const mint = new PublicKey(params.mint);

      const mintInfo = await withTimeout(
        getMint(connection, mint),
        "Token mint lookup timed out. Check the mint address and RPC connection."
      );
      const totalAmount = new BN(toRawTokenAmount(params.amount, mintInfo.decimals).toString());

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

      setStatus("awaiting_signature");
      const sig = await sendTransaction(tx, connection, { signers });
      setStatus("confirming");
      await connection.confirmTransaction(sig, "confirmed");
      setSignature(sig);
      setStatus("success");
      await queryClient.invalidateQueries({ queryKey: ["streams"] });
    } catch (err: unknown) {
      setError(getTransactionErrorMessage(err, "Transaction failed"));
      setStatus("error");
    }
  };

  const reset = () => { setStatus("idle"); setSignature(""); setError(""); };

  return { create, status, signature, error, reset };
}
