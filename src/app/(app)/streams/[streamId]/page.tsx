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
import { decodeStreamAccount, LEGACY_STREAM_ACCOUNT_SIZE, recoverLegacyVestingMetadata } from "@/lib/anchor/program";
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
  formatTokenAmountCompact,
} from "@/lib/utils/format";
import { IS_LEGACY_RECOVERY_ENABLED, SOLANA_CLUSTER } from "@/lib/env";
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

      const decodedStream = decodeStreamAccount(streamPublicKey, account.data);

      if (IS_LEGACY_RECOVERY_ENABLED && account.data.length === LEGACY_STREAM_ACCOUNT_SIZE) {
        const recoveredVestingMetadata = await recoverLegacyVestingMetadata(connection, streamPublicKey);
        if (recoveredVestingMetadata) {
          decodedStream.vestingType = recoveredVestingMetadata.vestingType;
          decodedStream.milestoneTime = recoveredVestingMetadata.milestoneTime;
          decodedStream.vestingTypeSource = "createTransaction";
        }
      }

      return decodedStream;
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
          This stream account could not be loaded from {SOLANA_CLUSTER}.
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
  const canSetMilestoneOnChain = lifecycle.mode === "milestone" && stream.onChainVestingType === "milestone";
  const isRecoveredLegacyMilestone = lifecycle.mode === "milestone" && !canSetMilestoneOnChain;
  const withdrawBusy = isProcessingStream(stream.publicKey);
  const withdrawPending = withdrawStatus === "preparing" || withdrawStatus === "awaiting_signature" || withdrawStatus === "confirming";
  const withdrawSucceeded = withdrawStatus === "success" && activeStreamId === stream.publicKey.toBase58();
  const hasPrimaryActions = Boolean(
    isRecipient
    || (isCreator && canSetMilestoneOnChain && !stream.milestoneReached && !stream.canceled)
    || (isCreator && stream.cancelable && lifecycle.status !== "cancelled" && !lifecycle.readyToClose)
    || (isCreator && lifecycle.readyToClose)
  );

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
    if (isRecoveredLegacyMilestone) return "This stream was created against the legacy program, so milestone confirmation cannot be submitted until the program is redeployed and the stream is recreated.";
    if (lifecycle.status === "awaiting_milestone") return lifecycle.mode === "milestone"
      ? "The creator can mark the milestone reached. Recipient withdrawal still waits for the milestone gate time."
      : "Creator follow-up is needed when the milestone is actually completed.";
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
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/creator" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950">
        <ArrowLeft size={14} /> Back to streams
      </Link>

      <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">Stream account</p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">Stream Detail</h1>
        </div>
        <StreamStatusBadge status={lifecycle.status} readyToClose={lifecycle.readyToClose} />
      </div>

      {cancelError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {cancelError}
        </div>
      )}
      {withdrawError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {withdrawError}
        </div>
      )}
      {milestoneError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {milestoneError}
        </div>
      )}
      {closeError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {closeError}
        </div>
      )}

      <div className="mb-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-500">Lifecycle Progress</span>
          <span className="font-mono font-semibold text-zinc-950">{lifecycle.breakdown.vestingProgressPct}% vested</span>
        </div>
        <AmountBreakdownBar breakdown={lifecycle.breakdown} />
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-medium text-zinc-400">Total</p>
            <p className="font-mono text-sm font-semibold text-zinc-950">{formatTokenAmount(stream.totalAmount, decimals)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400">Vested</p>
            <p className="font-mono text-sm font-semibold text-zinc-950">{formatTokenAmount(lifecycle.breakdown.vested, decimals)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400">Claimed</p>
            <p className="font-mono text-sm font-semibold text-zinc-950">{formatTokenAmount(lifecycle.breakdown.claimed, decimals)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400">Claimable</p>
            <p className="font-mono text-sm font-semibold text-violet-600">{formatTokenAmountCompact(claimable, decimals)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <StreamTimeline stream={stream} mode={lifecycle.mode} />
      </div>

      <div className="mb-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
        <h2 className="mb-4 text-sm font-semibold text-zinc-950">Action State</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Recipient</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">{getRecipientActionMessage()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Creator</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">{getCreatorActionMessage()}</p>
          </div>
        </div>

        {lifecycle.mode === "milestone" ? (
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              {stream.milestoneReached ? "Milestone reached" : "Milestone pending"}
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {isRecoveredLegacyMilestone
                ? "The UI recovered this milestone type from the create transaction, but the current on-chain account is legacy linear storage. Recreate it after the updated program is deployed before marking a milestone reached."
                : stream.milestoneReached
                ? "The creator has marked this milestone as complete, so recipient withdrawal depends on remaining claimable balance."
                : "No vesting is unlocked yet because this stream waits for explicit milestone completion."}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mb-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
        <h2 className="mb-4 text-sm font-semibold text-zinc-950">Stream Info</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Creator", value: stream.creator },
            { label: "Recipient", value: stream.recipient },
            { label: "Token Mint", value: stream.mint },
            { label: "Escrow", value: stream.escrowTokenAccount },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-zinc-700">
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
          <div className="mt-1 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3 sm:grid-cols-3">
            {lifecycle.mode === "milestone" ? (
              <>
                <div>
                  <p className="text-[11px] text-zinc-400">Gate</p>
                  <p className="text-xs text-zinc-700">{formatDate(stream.milestoneTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Milestone</p>
                  <p className="text-xs text-zinc-700">{stream.milestoneReached ? "Reached" : "Pending"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Release</p>
                  <p className="text-xs text-zinc-700">Full amount</p>
                </div>
              </>
            ) : lifecycle.mode === "cliff" ? (
              <>
                <div>
                  <p className="text-[11px] text-zinc-400">Locked Until</p>
                  <p className="text-xs text-zinc-700">{formatDate(stream.endTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Release</p>
                  <p className="text-xs text-zinc-700">Full amount</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[11px] text-zinc-400">Start</p>
                  <p className="text-xs text-zinc-700">{formatDate(stream.startTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">End</p>
                  <p className="text-xs text-zinc-700">{formatDate(stream.endTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Release</p>
                  <p className="text-xs text-zinc-700">Linear</p>
                </div>
              </>
            )}
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

      {hasPrimaryActions ? (
        <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
          <div className="flex flex-col gap-3 sm:flex-row">
            {isRecipient ? (
              <button
                onClick={() => withdraw(stream.publicKey, {
                  mint: stream.mint,
                  escrowTokenAccount: stream.escrowTokenAccount,
                  escrowBump: stream.escrowBump,
                })}
                disabled={claimable <= 0 || !isRecipient || withdrawPending}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]"
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
                  <>Withdraw {formatTokenAmountCompact(claimable, decimals)}</>
                ) : (
                  "No tokens claimable yet"
                )}
              </button>
            ) : null}
            {isCreator && canSetMilestoneOnChain && !stream.milestoneReached && !stream.canceled ? (
              <button
                onClick={() => setMilestone(stream.publicKey)}
                disabled={milestoneStatus === "preparing" || milestoneStatus === "awaiting_signature" || milestoneStatus === "confirming"}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition-all hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]"
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
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.97]"
              >
                Cancel Stream
              </button>
            )}
            {isCreator && lifecycle.readyToClose ? (
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-50 active:scale-[0.97]"
              >
                Close Stream
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl">
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
                className="flex-1 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Keep Stream
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelStatus === "preparing" || cancelStatus === "awaiting_signature" || cancelStatus === "confirming"}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
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
          <div className="mx-4 w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl">
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
                className="flex-1 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Keep Open
              </button>
              <button
                onClick={handleClose}
                disabled={closeStatus === "preparing" || closeStatus === "awaiting_signature" || closeStatus === "confirming"}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
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
