import { PublicKey } from "@solana/web3.js";

export type VestingType = "cliff" | "linear" | "milestone";
export type VestingTypeSource = "account" | "createTransaction";

export interface StreamAccount {
  publicKey: PublicKey;
  creator: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  escrowTokenAccount: PublicKey;
  streamId: number;
  totalAmount: number;
  withdrawnAmount: number;
  startTime: number;
  cliffTime: number;
  endTime: number;
  cancelable: boolean;
  canceled: boolean;
  vestingType: VestingType;
  onChainVestingType: VestingType;
  vestingTypeSource: VestingTypeSource;
  milestoneReached: boolean;
  milestoneTime: number;
  bump: number;
  escrowBump: number;
  createdAt: number;
}
