"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { ArrowRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useCreateStream } from "@/hooks/useCreateStream";
import { explorerUrl } from "@/lib/utils/format";

export default function CreateStreamPage() {
  const { create, status, signature, error: txError, reset } = useCreateStream();

  const [mode, setMode] = useState<"time-based" | "milestone-based">("time-based");
  const [recipient, setRecipient] = useState("");
  const [mint, setMint] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [cliffDate, setCliffDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cancelable, setCancelable] = useState(true);
  const [validationError, setValidationError] = useState("");

  const validate = (): string | null => {
    try { new PublicKey(recipient); } catch { return "Invalid recipient address"; }
    try { new PublicKey(mint); } catch { return "Invalid token mint address"; }
    if (!amount || parseFloat(amount) <= 0) return "Amount must be greater than zero";
    if (mode === "milestone-based") return null;
    if (!startDate) return "Start date is required";
    if (!endDate) return "End date is required";
    const start = Math.floor(new Date(startDate).getTime() / 1000);
    const end = Math.floor(new Date(endDate).getTime() / 1000);
    const cliff = cliffDate ? Math.floor(new Date(cliffDate).getTime() / 1000) : start;
    if (start >= end) return "Start date must be before end date";
    if (cliff < start) return "Cliff date cannot be before start date";
    if (cliff > end) return "Cliff date cannot be after end date";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    const err = validate();
    if (err) { setValidationError(err); return; }

    const now = Math.floor(Date.now() / 1000);
    const start = mode === "time-based" ? Math.floor(new Date(startDate).getTime() / 1000) : now;
    const cliff = mode === "time-based"
      ? (cliffDate ? Math.floor(new Date(cliffDate).getTime() / 1000) : start)
      : now;
    const end = mode === "time-based" ? Math.floor(new Date(endDate).getTime() / 1000) : now + 1;

    await create({
      recipient,
      mint,
      amount,
      startTime: start,
      cliffTime: cliff,
      endTime: end,
      cancelable,
      milestoneBased: mode === "milestone-based",
    });
  };

  const displayError = validationError || txError;

  if (status === "success") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 rounded-[32px] border border-zinc-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CircleCheck size={34} strokeWidth={1.75} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Stream Created</h2>
        <p className="text-sm leading-relaxed text-zinc-500">
          Your {mode === "milestone-based" ? "milestone-based" : "time-based"} vesting stream is now active on-chain.
        </p>
        {signature && (
          <a
            href={explorerUrl(signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-violet-600 transition-colors hover:text-violet-500"
          >
            View on Explorer →
          </a>
        )}
        <button onClick={reset} className="mt-2 text-sm font-medium text-zinc-500 hover:text-zinc-700">
          Create another stream
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_18px_70px_rgba(24,24,27,0.055)]">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Create Stream</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">Lock tokens in escrow with a vesting schedule.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
          <p className="text-sm font-semibold text-zinc-950">Stream Mode</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("time-based")}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                mode === "time-based"
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-300"
              }`}
            >
              <p className="text-sm font-semibold">Time-based</p>
              <p className={`mt-1 text-xs leading-relaxed ${mode === "time-based" ? "text-white/68" : "text-zinc-500"}`}>Unlocks by start, cliff, and end schedule.</p>
            </button>
            <button
              type="button"
              onClick={() => setMode("milestone-based")}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                mode === "milestone-based"
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-300"
              }`}
            >
              <p className="text-sm font-semibold">Milestone-based</p>
              <p className={`mt-1 text-xs leading-relaxed ${mode === "milestone-based" ? "text-white/68" : "text-zinc-500"}`}>Unlocks only after the creator marks a milestone complete.</p>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Solana wallet address"
            className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 transition-all placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700">Token Mint Address</label>
          <input
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="SPL token mint address"
            className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 transition-all placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="any"
            className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 transition-all placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
          />
        </div>

        {mode === "time-based" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700">Start Date</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 transition-all focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700">Cliff Date</label>
              <input
                type="datetime-local"
                value={cliffDate}
                onChange={(e) => setCliffDate(e.target.value)}
                className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 transition-all focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
              />
              <span className="text-[11px] text-zinc-400">Optional, defaults to start</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700">End Date</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-950 transition-all focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-sm font-medium text-amber-900">Milestone unlock flow</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              No schedule dates are needed. Tokens stay locked until you, as creator, mark the milestone as completed from the stream detail page.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCancelable(!cancelable)}
            className={`relative h-7 w-12 rounded-full transition-colors ${cancelable ? "bg-violet-600" : "bg-zinc-200"}`}
          >
            <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${cancelable ? "left-6" : "left-1"}`} />
          </button>
          <span className="text-sm font-medium text-zinc-700">Cancelable stream</span>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.045)]">
          <p className="text-sm font-semibold text-zinc-950">Unlock Preview</p>
          {mode === "time-based" ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Tokens unlock over time from the start date, remain blocked until the cliff if one is set, then continue vesting linearly until the end date.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Tokens remain fully locked until the creator confirms milestone completion. After that, the recipient can withdraw the unlocked balance.
            </p>
          )}
        </div>

        {displayError && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5">
            <CircleAlert size={16} className="text-red-500 shrink-0" />
            <span className="text-sm text-red-600">{displayError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "preparing" || status === "awaiting_signature" || status === "confirming"}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 active:-translate-y-[1px] active:scale-[0.97]"
        >
          {status === "preparing" || status === "awaiting_signature" || status === "confirming" ? (
            <><LoaderCircle size={16} className="animate-spin" /> {
              status === "preparing" ? "Preparing transaction..." :
              status === "awaiting_signature" ? "Approve in wallet..." :
              "Confirming..."
            }</>
          ) : (
            <>Create {mode === "milestone-based" ? "Milestone" : "Time-based"} Stream <ArrowRight size={14} strokeWidth={2.5} /></>
          )}
        </button>
      </form>
    </div>
  );
}
