"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, ArrowSquareOut, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { getProgram } from "@/lib/anchor/program";
import type { StreamAccount } from "@/lib/anchor/types";
import { useCancelStream } from "@/hooks/useCancelStream";
import {
  explorerAccountUrl,
  formatDate,
  formatTokenAmount,
  getClaimableAmount,
  getStreamStatus,
  getVestedAmount,
} from "@/lib/utils/format";

export default function StreamDetailPage() {
  const params = useParams<{ streamId: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { cancel, status: cancelStatus, error: cancelError } = useCancelStream();

  const { data: stream, isLoading, error } = useQuery<StreamAccount>({
    queryKey: ["stream", params.streamId, wallet?.publicKey?.toBase58()],
    queryFn: async () => {
      if (!wallet) throw new Error("Wallet not connected");

      const streamPublicKey = new PublicKey(params.streamId);
      const account = await connection.getAccountInfo(streamPublicKey);
      if (!account) throw new Error("Stream account not found");

      const program = getProgram(connection, wallet);
      const decoded = program.coder.accounts.decode("Stream", account.data);

      return {
        publicKey: streamPublicKey,
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
    },
    enabled: !!wallet?.publicKey && !!params.streamId,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <WarningCircle size={48} weight="duotone" className="text-red-400" />
        <h1 className="text-xl font-semibold text-zinc-900">Stream not found</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          This stream account could not be loaded from devnet.
        </p>
        <Link href="/dashboard/creator" className="text-sm font-medium text-violet-600 hover:text-violet-500">
          Back to streams
        </Link>
      </div>
    );
  }

  const status = getStreamStatus(stream);
  const vested = getVestedAmount(stream.totalAmount, stream.startTime, stream.cliffTime, stream.endTime);
  const claimable = getClaimableAmount(stream.totalAmount, stream.withdrawnAmount, stream.startTime, stream.cliffTime, stream.endTime);
  const pct = stream.totalAmount > 0 ? Math.round((stream.withdrawnAmount / stream.totalAmount) * 100) : 0;
  const isCreator = publicKey?.equals(stream.creator);
  const isRecipient = publicKey?.equals(stream.recipient);

  const handleCancel = async () => {
    await cancel(stream.publicKey, {
      recipient: stream.recipient,
      mint: stream.mint,
      escrowTokenAccount: stream.escrowTokenAccount,
    });
    setShowCancelModal(false);
  };

  const copyToClipboard = (text: string | PublicKey) => navigator.clipboard.writeText(text.toString());

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/creator" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900">
        <ArrowLeft size={14} /> Back to streams
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Stream Detail</h1>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            status === "active" ? "bg-emerald-50 text-emerald-600" :
            status === "completed" ? "bg-violet-50 text-violet-600" :
            "bg-zinc-100 text-zinc-500"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {cancelError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {cancelError}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-500">Vesting Progress</span>
          <span className="font-mono font-semibold text-zinc-900">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 border-t border-zinc-100 pt-4">
          <div>
            <p className="text-[11px] text-zinc-400">Total</p>
            <p className="font-mono text-sm font-semibold text-zinc-900">{formatTokenAmount(stream.totalAmount, 6)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400">Vested</p>
            <p className="font-mono text-sm font-semibold text-zinc-900">{formatTokenAmount(vested, 6)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400">Withdrawn</p>
            <p className="font-mono text-sm font-semibold text-zinc-900">{formatTokenAmount(stream.withdrawnAmount, 6)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400">Claimable</p>
            <p className="font-mono text-sm font-semibold text-emerald-600">{formatTokenAmount(claimable, 6)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Stream Info</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Creator", value: stream.creator },
            { label: "Recipient", value: stream.recipient },
            { label: "Token Mint", value: stream.mint },
            { label: "Escrow", value: stream.escrowTokenAccount },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-700">
                  {row.value.toString().slice(0, 8)}...{row.value.toString().slice(-6)}
                </span>
                <a
                  href={explorerAccountUrl(row.value)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-zinc-600"
                  aria-label={`Open ${row.label} in Solana Explorer`}
                >
                  <ArrowSquareOut size={12} />
                </a>
                <button
                  onClick={() => copyToClipboard(row.value)}
                  className="text-zinc-400 hover:text-zinc-600"
                  aria-label={`Copy ${row.label}`}
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          ))}
          <div className="mt-1 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-3">
            <div>
              <p className="text-[11px] text-zinc-400">Start</p>
              <p className="text-xs text-zinc-700">{formatDate(stream.startTime)}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">Cliff</p>
              <p className="text-xs text-zinc-700">{formatDate(stream.cliffTime)}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">End</p>
              <p className="text-xs text-zinc-700">{formatDate(stream.endTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] text-zinc-400">Cancelable:</span>
            <span className="text-xs text-zinc-700">{stream.cancelable ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {isRecipient && claimable > 0 && (
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-violet-500 active:scale-[0.97]">
            Withdraw {formatTokenAmount(claimable, 6)}
          </button>
        )}
        {isCreator && stream.cancelable && status === "active" && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 active:scale-[0.97]"
          >
            Cancel Stream
          </button>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <WarningCircle size={24} className="text-red-500" />
              <h3 className="text-lg font-semibold text-zinc-900">Cancel Stream?</h3>
            </div>
            <p className="mb-6 text-sm text-zinc-500">
              This will return unvested tokens to your wallet. The recipient can still claim any tokens already vested.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Keep Stream
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelStatus === "signing" || cancelStatus === "confirming"}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
              >
                {cancelStatus === "signing" || cancelStatus === "confirming" ? (
                  <><SpinnerGap size={14} className="animate-spin" /> {cancelStatus === "signing" ? "Approve..." : "Cancelling..."}</>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
