"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleAlert, CircleCheck, Copy, ExternalLink, LoaderCircle } from "lucide-react";
import { AmountBreakdownBar } from "@/components/dashboard/AmountBreakdownBar";
import { StreamStatusBadge } from "@/components/dashboard/StreamStatusBadge";
import { StreamTimeline } from "@/components/dashboard/StreamTimeline";
import { decodeStreamAccount } from "@/lib/anchor/program";
import type { StreamAccount } from "@/lib/anchor/types";
import { useCloseStream } from "@/hooks/useCloseStream";
import { useCancelStream } from "@/hooks/useCancelStream";
import { useMintDecimals } from "@/hooks/useMintDecimals";
import { useSetMilestone } from "@/hooks/useSetMilestone";
import { useWithdraw } from "@/hooks/useWithdraw";
import {
  explorerAccountUrl,
  formatDate,
  formatTokenAmount,
} from "@/lib/utils/format";
import { deriveStreamLifecycle, getModeLabel } from "@/lib/utils/streamLifecycle";

export default function StreamDetailPage() {
  const params = useParams<{ streamId: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const { cancel, status: cancelStatus, error: cancelError } = useCancelStream();
  const { closeStream, status: closeStatus, error: closeError } = useCloseStream();
  const { setMilestone, status: milestoneStatus, error: milestoneError } = useSetMilestone();
  const { withdraw, status: withdrawStatus, error: withdrawError, activeStreamId, isProcessingStream } = useWithdraw();

  const { data: stream, isLoading, error } = useQuery<StreamAccount>({
    queryKey: ["stream", params.streamId, wallet?.publicKey?.toBase58()],
    queryFn: async () => {
      if (!wallet) throw new Error("Wallet not connected");

      const streamPublicKey = new PublicKey(params.streamId);
      const account = await connection.getAccountInfo(streamPublicKey);
      if (!account) throw new Error("Stream account not found");

      return decodeStreamAccount(streamPublicKey, account.data);
    },
    enabled: !!wallet?.publicKey && !!params.streamId,
    retry: 1,
  });
  const { data: mintDecimals = {} } = useMintDecimals([stream?.mint]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <CircleAlert size={48} strokeWidth={1.75} className="text-red-400" />
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

  const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;
  const lifecycle = deriveStreamLifecycle(stream);
  const claimable = lifecycle.breakdown.claimable;
  const isCreator = publicKey?.equals(stream.creator);
  const isRecipient = publicKey?.equals(stream.recipient);
  const withdrawBusy = isProcessingStream(stream.publicKey);
  const withdrawSucceeded = withdrawStatus === "success" && activeStreamId === stream.publicKey.toBase58();

  const getRecipientActionMessage = () => {
    if (lifecycle.breakdown.claimable > 0) return "You can withdraw unlocked tokens from this stream now.";
    if (lifecycle.status === "awaiting_milestone") return "Recipient action is blocked until the creator marks the milestone as completed.";
    if (lifecycle.status === "cliff_locked") return "Recipient action is blocked until the cliff date is reached.";
    if (lifecycle.status === "scheduled") return "Recipient action is not available until this stream starts.";
    if (lifecycle.status === "completed") return "No recipient action is left. This stream is already fully settled.";

    return "No recipient action is available at this moment.";
  };

  const getCreatorActionMessage = () => {
    if (lifecycle.readyToClose) return "This stream lifecycle is already settled.";
    if (lifecycle.status === "awaiting_milestone") return "Creator follow-up is needed when the milestone is actually completed.";
    if (stream.cancelable && lifecycle.status !== "cancelled") return "The creator can cancel this stream while it is still active.";
    if (!stream.cancelable) return "This stream was created as non-cancelable.";

    return "No creator action is required right now.";
  };

  const handleCancel = async () => {
    await cancel(stream.publicKey, {
      recipient: stream.recipient,
      mint: stream.mint,
      escrowTokenAccount: stream.escrowTokenAccount,
    });
    setShowCancelModal(false);
  };

  const handleClose = async () => {
    await closeStream(stream.publicKey, {
      escrowTokenAccount: stream.escrowTokenAccount,
    });
    setShowCloseModal(false);
  };

  const copyToClipboard = (text: string | PublicKey) => navigator.clipboard.writeText(text.toString());

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/creator" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900">
        <ArrowLeft size={14} /> Back to streams
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Stream Detail</h1>
        <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
      </div>

      {cancelError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {cancelError}
        </div>
      )}
      {withdrawError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {withdrawError}
        </div>
      )}
      {milestoneError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {milestoneError}
        </div>
      )}
      {closeError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {closeError}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-500">Lifecycle Progress</span>
          <span className="font-mono font-semibold text-zinc-900">{lifecycle.breakdown.vestingProgressPct}% vested</span>
        </div>
        <AmountBreakdownBar breakdown={lifecycle.breakdown} />
        <div className="mt-4 grid grid-cols-4 gap-4 border-t border-zinc-100 pt-4">
          <div>
            <p className="text-[11px] text-zinc-400">Total</p>
            <p className="font-mono text-sm font-semibold text-zinc-900">{formatTokenAmount(stream.totalAmount, decimals)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400">Vested</p>
            <p className="font-mono text-sm font-semibold text-zinc-900">{formatTokenAmount(lifecycle.breakdown.vested, decimals)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400">Claimed</p>
            <p className="font-mono text-sm font-semibold text-zinc-900">{formatTokenAmount(lifecycle.breakdown.claimed, decimals)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400">Claimable</p>
            <p className="font-mono text-sm font-semibold text-emerald-600">{formatTokenAmount(claimable, decimals)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <StreamTimeline stream={stream} mode={lifecycle.mode} />
      </div>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Action State</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Recipient</p>
            <p className="mt-2 text-sm text-zinc-700">{getRecipientActionMessage()}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">Creator</p>
            <p className="mt-2 text-sm text-zinc-700">{getCreatorActionMessage()}</p>
          </div>
        </div>

        {lifecycle.mode === "milestone-based" ? (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              {stream.milestoneReached ? "Milestone reached" : "Milestone pending"}
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {stream.milestoneReached
                ? "The creator has marked this milestone as complete, so recipient withdrawal depends on remaining claimable balance."
                : "No vesting is unlocked yet because this stream waits for explicit milestone completion."}
            </p>
          </div>
        ) : null}
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
                  <ExternalLink size={12} />
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
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Mode:</span>
              <span className="text-xs text-zinc-700">{getModeLabel(lifecycle.mode)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Cancelable:</span>
              <span className="text-xs text-zinc-700">{stream.cancelable ? "Yes" : "No"}</span>
            </div>
            <span className="font-mono text-xs text-zinc-500">{lifecycle.nextEventLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {isRecipient ? (
          <button
            onClick={() => withdraw(stream.publicKey, {
              mint: stream.mint,
              escrowTokenAccount: stream.escrowTokenAccount,
              escrowBump: stream.escrowBump,
            })}
            disabled={claimable <= 0 || !isRecipient || (withdrawStatus !== "idle" && !withdrawBusy)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-60 active:scale-[0.97]"
          >
            {withdrawBusy ? (
              <><LoaderCircle size={14} className="animate-spin" /> {
                withdrawStatus === "preparing" ? "Preparing..." :
                withdrawStatus === "awaiting_signature" ? "Approve..." :
                "Confirming..."
              }</>
            ) : withdrawSucceeded ? (
              "Withdrawn"
            ) : claimable > 0 ? (
              <>Withdraw {formatTokenAmount(claimable, decimals)}</>
            ) : (
              "No tokens claimable yet"
            )}
          </button>
        ) : null}
        {isCreator && lifecycle.mode === "milestone-based" && !stream.milestoneReached && !stream.canceled ? (
          <button
            onClick={() => setMilestone(stream.publicKey)}
            disabled={milestoneStatus === "preparing" || milestoneStatus === "awaiting_signature" || milestoneStatus === "confirming"}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-violet-200 px-4 py-3 text-sm font-medium text-violet-700 transition-all hover:bg-violet-50 disabled:opacity-60 active:scale-[0.97]"
          >
            {milestoneStatus === "preparing" || milestoneStatus === "awaiting_signature" || milestoneStatus === "confirming" ? (
              <><LoaderCircle size={14} className="animate-spin" /> {
                milestoneStatus === "preparing" ? "Preparing..." :
                milestoneStatus === "awaiting_signature" ? "Approve..." :
                "Confirming..."
              }</>
            ) : (
              "Mark Milestone Reached"
            )}
          </button>
        ) : null}
        {isCreator && stream.cancelable && lifecycle.status !== "cancelled" && !lifecycle.readyToClose && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 active:scale-[0.97]"
          >
            Cancel Stream
          </button>
        )}
        {isCreator && lifecycle.readyToClose ? (
          <button
            onClick={() => setShowCloseModal(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-50 active:scale-[0.97]"
          >
            Close Stream
          </button>
        ) : null}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <CircleAlert size={24} className="text-red-500" />
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
                disabled={cancelStatus === "preparing" || cancelStatus === "awaiting_signature" || cancelStatus === "confirming"}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
              >
                {cancelStatus === "preparing" || cancelStatus === "awaiting_signature" || cancelStatus === "confirming" ? (
                  <><LoaderCircle size={14} className="animate-spin" /> {
                    cancelStatus === "preparing" ? "Preparing..." :
                    cancelStatus === "awaiting_signature" ? "Approve..." :
                    "Cancelling..."
                  }</>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <CircleCheck size={24} className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-zinc-900">Close Stream?</h3>
            </div>
            <p className="mb-6 text-sm text-zinc-500">
              This closes the settled stream account and returns any remaining account rent to the creator wallet.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Keep Open
              </button>
              <button
                onClick={handleClose}
                disabled={closeStatus === "preparing" || closeStatus === "awaiting_signature" || closeStatus === "confirming"}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
              >
                {closeStatus === "preparing" || closeStatus === "awaiting_signature" || closeStatus === "confirming" ? (
                  <><LoaderCircle size={14} className="animate-spin" /> {
                    closeStatus === "preparing" ? "Preparing..." :
                    closeStatus === "awaiting_signature" ? "Approve..." :
                    "Closing..."
                  }</>
                ) : (
                  "Confirm Close"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
