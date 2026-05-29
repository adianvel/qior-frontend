export type TxStatus =
  | "idle"
  | "preparing"
  | "awaiting_signature"
  | "confirming"
  | "success"
  | "error";

export function getTransactionErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error || fallback);
  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("rejected the request")) {
    return "Wallet approval was rejected.";
  }

  if (lower.includes("invalid account data")) {
    return "Invalid token mint address. Use an existing SPL token mint on this network.";
  }

  if (lower.includes("insufficientfunds") || lower.includes("insufficient funds")) {
    return "Insufficient token balance or SOL to complete this transaction.";
  }

  if (lower.includes("nothingtowithdraw") || lower.includes("no tokens available")) {
    return "There are no unlocked tokens available to withdraw yet.";
  }

  if (lower.includes("unauthorized") || lower.includes("signer is not authorized")) {
    return "The connected wallet is not authorized for this action.";
  }

  if (lower.includes("streamnotcancelable")) {
    return "This stream was created as non-cancelable.";
  }

  if (lower.includes("alreadycancelled")) {
    return "This stream has already been canceled.";
  }

  if (lower.includes("notmilestonestream")) {
    return "This stream is not configured as a milestone-based stream.";
  }

  if (lower.includes("fullyvested")) {
    return "This stream is already fully unlocked for withdrawal.";
  }

  if (lower.includes("streamnotsettled")) {
    return "This stream is not fully settled and cannot be closed yet.";
  }

  return message || fallback;
}
