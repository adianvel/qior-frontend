"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { ArrowRight, CheckCircle, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useCreateStream } from "@/hooks/useCreateStream";
import { explorerUrl } from "@/lib/utils/format";

export default function CreateStreamPage() {
  const { create, status, signature, error: txError, reset } = useCreateStream();

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

    const start = Math.floor(new Date(startDate).getTime() / 1000);
    const cliff = cliffDate ? Math.floor(new Date(cliffDate).getTime() / 1000) : start;
    const end = Math.floor(new Date(endDate).getTime() / 1000);

    await create({
      recipient,
      mint,
      amount,
      startTime: start,
      cliffTime: cliff,
      endTime: end,
      cancelable,
    });
  };

  const displayError = validationError || txError;

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle size={56} weight="duotone" className="text-emerald-500" />
        <h2 className="text-xl font-semibold text-zinc-900">Stream Created</h2>
        <p className="text-sm text-zinc-500">Your vesting stream is now active on-chain.</p>
        {signature && (
          <a
            href={explorerUrl(signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-600 hover:text-violet-500 transition-colors"
          >
            View on Explorer →
          </a>
        )}
        <button onClick={reset} className="text-sm text-zinc-500 hover:text-zinc-700 mt-2">
          Create another stream
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Create Stream</h1>
      <p className="text-sm text-zinc-500 mt-1">Lock tokens in escrow with a vesting schedule.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Solana wallet address"
            className="px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Token Mint Address</label>
          <input
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="SPL token mint address"
            className="px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="any"
            className="px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Start Date</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Cliff Date</label>
            <input
              type="datetime-local"
              value={cliffDate}
              onChange={(e) => setCliffDate(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
            <span className="text-[11px] text-zinc-400">Optional, defaults to start</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">End Date</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCancelable(!cancelable)}
            className={`w-10 h-6 rounded-full transition-colors relative ${cancelable ? "bg-violet-600" : "bg-zinc-200"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${cancelable ? "left-5" : "left-1"}`} />
          </button>
          <span className="text-sm text-zinc-700">Cancelable stream</span>
        </div>

        {displayError && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-100">
            <WarningCircle size={16} className="text-red-500 shrink-0" />
            <span className="text-sm text-red-600">{displayError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "preparing" || status === "awaiting_signature" || status === "confirming"}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg active:scale-[0.97] active:-translate-y-[1px] transition-all mt-2"
        >
          {status === "preparing" || status === "awaiting_signature" || status === "confirming" ? (
            <><SpinnerGap size={16} className="animate-spin" /> {
              status === "preparing" ? "Preparing transaction..." :
              status === "awaiting_signature" ? "Approve in wallet..." :
              "Confirming..."
            }</>
          ) : (
            <>Create Stream <ArrowRight size={14} weight="bold" /></>
          )}
        </button>
      </form>
    </div>
  );
}
