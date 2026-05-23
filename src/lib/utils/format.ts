import { PublicKey } from "@solana/web3.js";
import { SOLANA_CLUSTER } from "@/lib/env";

export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const str = address.toString();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function formatTokenAmount(amount: number, decimals: number): string {
  return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getVestedAmount(
  totalAmount: number,
  startTime: number,
  cliffTime: number,
  endTime: number,
  now?: number
): number {
  const currentTime = now || Math.floor(Date.now() / 1000);
  if (currentTime < cliffTime) return 0;
  if (currentTime >= endTime) return totalAmount;
  return Math.floor(totalAmount * (currentTime - startTime) / (endTime - startTime));
}

export function getClaimableAmount(
  totalAmount: number,
  withdrawnAmount: number,
  startTime: number,
  cliffTime: number,
  endTime: number
): number {
  const vested = getVestedAmount(totalAmount, startTime, cliffTime, endTime);
  return Math.max(0, vested - withdrawnAmount);
}

export function getStreamStatus(stream: {
  canceled: boolean;
  totalAmount: number;
  withdrawnAmount: number;
  endTime: number;
}): "active" | "completed" | "cancelled" {
  if (stream.canceled) return "cancelled";
  if (Date.now() / 1000 >= stream.endTime && stream.withdrawnAmount >= stream.totalAmount) return "completed";
  return "active";
}

export function explorerUrl(signature: string, cluster = SOLANA_CLUSTER): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function explorerAccountUrl(address: string | PublicKey, cluster = SOLANA_CLUSTER): string {
  return `https://explorer.solana.com/address/${address.toString()}?cluster=${cluster}`;
}
