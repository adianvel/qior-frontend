import { PublicKey } from "@solana/web3.js";

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
  milestoneBased: boolean;
  milestoneReached: boolean;
  bump: number;
  escrowBump: number;
  createdAt: number;
}
