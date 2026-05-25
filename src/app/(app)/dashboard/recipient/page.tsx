"use client";

import { Wallet, SpinnerGap, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useStreams } from "@/hooks/useStreams";
import { useMintDecimals } from "@/hooks/useMintDecimals";
import { useWithdraw } from "@/hooks/useWithdraw";
import { getStreamStatus, getClaimableAmount, formatTokenAmount, shortenAddress, formatTimeRemaining } from "@/lib/utils/format";

export default function RecipientDashboardPage() {
  const { data: streams, isLoading, error, refetch } = useStreams("recipient");
  const { data: mintDecimals = {} } = useMintDecimals(streams?.map((stream) => stream.mint) ?? []);
  const { withdraw, status: withdrawStatus, error: withdrawError } = useWithdraw();
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SpinnerGap size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <WarningCircle size={48} weight="duotone" className="text-red-400" />
        <h2 className="text-lg font-semibold text-zinc-900">Couldn&apos;t load incoming streams</h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          {errorMessage}
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg active:scale-[0.97] transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Wallet size={48} weight="duotone" className="text-zinc-300" />
        <h2 className="text-lg font-semibold text-zinc-900">No incoming streams</h2>
        <p className="text-sm text-zinc-500 text-center max-w-sm">
          No tokens are being vested to your wallet yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Incoming Streams</h1>
      <p className="text-sm text-zinc-500 mt-0.5 mb-8">Tokens being vested to your wallet.</p>
      {withdrawError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {withdrawError}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {streams.map((stream) => {
          const status = getStreamStatus(stream);
          const decimals = mintDecimals[stream.mint.toBase58()] ?? 6;
          const claimable = getClaimableAmount(
            stream.totalAmount, stream.withdrawnAmount,
            stream.startTime, stream.cliffTime, stream.endTime
          );
          const pct = stream.totalAmount > 0 ? Math.round((stream.withdrawnAmount / stream.totalAmount) * 100) : 0;

          return (
            <div key={stream.publicKey.toBase58()} className="border border-zinc-200 rounded-xl bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-400">From</p>
                  <p className="text-sm font-mono text-zinc-900">{shortenAddress(stream.creator, 6)}</p>
                  <p className="text-xs font-mono text-zinc-400 mt-1">{formatTimeRemaining(stream.endTime)}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    status === "active" ? "bg-emerald-50 text-emerald-600" :
                    status === "completed" ? "bg-violet-50 text-violet-600" :
                    "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                  <span>Withdrawn: {formatTokenAmount(stream.withdrawnAmount, decimals)}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-100">
                <div>
                  <p className="text-[11px] text-zinc-400">Total</p>
                  <p className="text-sm font-mono font-semibold text-zinc-900">{formatTokenAmount(stream.totalAmount, decimals)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Claimed</p>
                  <p className="text-sm font-mono font-semibold text-zinc-900">{formatTokenAmount(stream.withdrawnAmount, decimals)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400">Claimable</p>
                  <p className="text-sm font-mono font-semibold text-emerald-600">{formatTokenAmount(claimable, decimals)}</p>
                </div>
              </div>

              <button
                onClick={() => withdraw(stream.publicKey, {
                  mint: stream.mint,
                  escrowTokenAccount: stream.escrowTokenAccount,
                  escrowBump: stream.escrowBump,
                })}
                disabled={claimable <= 0 || withdrawStatus !== "idle"}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg active:scale-[0.97] transition-all"
              >
                {withdrawStatus === "success" ? (
                  <><CheckCircle size={16} /> Withdrawn</>
                ) : withdrawStatus === "preparing" || withdrawStatus === "awaiting_signature" || withdrawStatus === "confirming" ? (
                  <><SpinnerGap size={16} className="animate-spin" /> {
                    withdrawStatus === "preparing" ? "Preparing..." :
                    withdrawStatus === "awaiting_signature" ? "Approve..." :
                    "Confirming..."
                  }</>
                ) : (
                  <>Withdraw {formatTokenAmount(claimable, decimals)}</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
