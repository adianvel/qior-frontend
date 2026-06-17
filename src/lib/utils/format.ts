import { PublicKey } from "@solana/web3.js";
import { IS_MAINNET, SOLANA_CLUSTER } from "@/lib/env";
import {
  getStreamClaimableAmount,
  getStreamLifecycleStatus,
  getStreamVestedAmount,
} from "@/lib/utils/streamLifecycle";

export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const str = address.toString();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function formatTokenAmount(amount: number, decimals: number): string {
  return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
}

export function formatTokenAmountCompact(amount: number, decimals: number, maxFractionDigits = 4): string {
  return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: Math.min(decimals, maxFractionDigits),
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeRemaining(endTime: number, now = Math.floor(Date.now() / 1000)): string {
  const seconds = endTime - now;

  if (seconds <= 0) return "Ended";

  const days = Math.floor(seconds / 86_400);
  if (days > 0) return `${days}d remaining`;

  const hours = Math.floor(seconds / 3_600);
  if (hours > 0) return `${hours}h remaining`;

  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) return `${minutes}m remaining`;

  return "Less than 1m remaining";
}

export function toRawTokenAmount(amount: string, decimals: number): bigint {
  const [wholePart, fractionalPart = ""] = amount.trim().split(".");
  const whole = wholePart || "0";
  const fraction = fractionalPart.padEnd(decimals, "0").slice(0, decimals);

  return BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fraction || "0");
}

export function getVestedAmount(
  totalAmount: number,
  startTime: number,
  cliffTime: number,
  endTime: number,
  now?: number
): number {
  return getStreamVestedAmount({
    totalAmount,
    withdrawnAmount: 0,
    startTime,
    cliffTime,
    endTime,
    canceled: false,
    vestingType: "linear",
    milestoneReached: false,
    milestoneTime: 0,
  }, now);
}

export function getClaimableAmount(
  totalAmount: number,
  withdrawnAmount: number,
  startTime: number,
  cliffTime: number,
  endTime: number
): number {
  return getStreamClaimableAmount({
    totalAmount,
    withdrawnAmount,
    startTime,
    cliffTime,
    endTime,
    canceled: false,
    vestingType: "linear",
    milestoneReached: false,
    milestoneTime: 0,
  });
}

export function getStreamStatus(stream: {
  canceled: boolean;
  totalAmount: number;
  withdrawnAmount: number;
  endTime: number;
  startTime?: number;
  cliffTime?: number;
  vestingType?: "cliff" | "linear" | "milestone";
  milestoneReached?: boolean;
  milestoneTime?: number;
}): "active" | "completed" | "cancelled" {
  const lifecycle = getStreamLifecycleStatus({
    totalAmount: stream.totalAmount,
    withdrawnAmount: stream.withdrawnAmount,
    startTime: stream.startTime ?? 0,
    cliffTime: stream.cliffTime ?? stream.startTime ?? 0,
    endTime: stream.endTime,
    canceled: stream.canceled,
    vestingType: stream.vestingType ?? "linear",
    milestoneReached: stream.milestoneReached ?? false,
    milestoneTime: stream.milestoneTime ?? 0,
  });

  if (lifecycle === "cancelled") return "cancelled";
  if (lifecycle === "completed") return "completed";
  return "active";
}

export function explorerUrl(signature: string, cluster = SOLANA_CLUSTER): string {
  const clusterQuery = IS_MAINNET || cluster === "mainnet" || cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;

  return `https://explorer.solana.com/tx/${signature}${clusterQuery}`;
}

export function explorerAccountUrl(address: string | PublicKey, cluster = SOLANA_CLUSTER): string {
  const clusterQuery = IS_MAINNET || cluster === "mainnet" || cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;

  return `https://explorer.solana.com/address/${address.toString()}${clusterQuery}`;
}
