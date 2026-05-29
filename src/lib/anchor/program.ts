import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { IDL } from "./idl";
import { PROGRAM_ID_STRING } from "@/lib/env";
import type { StreamAccount } from "./types";

export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

export function getProvider(connection: Connection, wallet: AnchorWallet) {
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getProgram(connection: Connection, wallet: AnchorWallet): any {
  const provider = getProvider(connection, wallet);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program({ ...IDL, address: PROGRAM_ID_STRING } as any, provider);
}

export function getStreamPDA(creator: PublicKey, recipient: PublicKey, streamId: BN) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("stream"),
      creator.toBuffer(),
      recipient.toBuffer(),
      streamId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
}

export function getEscrowAuthorityPDA(stream: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_authority"), stream.toBuffer()],
    PROGRAM_ID
  );
}

function createReader(data: Uint8Array) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 8; // Anchor account discriminator

  return {
    get offset() {
      return offset;
    },
    readPubkey() {
      const value = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;
      return value;
    },
    readU64() {
      const value = Number(view.getBigUint64(offset, true));
      offset += 8;
      return value;
    },
    readI64() {
      const value = Number(view.getBigInt64(offset, true));
      offset += 8;
      return value;
    },
    readBool() {
      const value = data[offset];
      if (value !== 0 && value !== 1) {
        throw new Error(`Invalid bool: ${value}`);
      }
      offset += 1;
      return value === 1;
    },
    readU8() {
      const value = data[offset];
      offset += 1;
      return value;
    },
  };
}

export function decodeStreamAccount(publicKey: PublicKey, data: Uint8Array): StreamAccount {
  const reader = createReader(data);

  const stream = {
    publicKey,
    creator: reader.readPubkey(),
    recipient: reader.readPubkey(),
    mint: reader.readPubkey(),
    escrowTokenAccount: reader.readPubkey(),
    streamId: reader.readU64(),
    totalAmount: reader.readU64(),
    withdrawnAmount: reader.readU64(),
    startTime: reader.readI64(),
    cliffTime: reader.readI64(),
    endTime: reader.readI64(),
    cancelable: reader.readBool(),
    canceled: reader.readBool(),
    milestoneBased: false,
    milestoneReached: false,
    bump: 0,
    escrowBump: 0,
    createdAt: 0,
  };

  const remaining = data.length - reader.offset;
  if (remaining >= 12) {
    stream.milestoneBased = reader.readBool();
    stream.milestoneReached = reader.readBool();
  }

  stream.bump = reader.readU8();
  stream.escrowBump = reader.readU8();
  stream.createdAt = reader.readI64();

  return stream;
}

export async function createStreamTx(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  creator: PublicKey,
  params: {
    streamId: BN;
    recipient: PublicKey;
    mint: PublicKey;
    totalAmount: BN;
    startTime: BN;
    cliffTime: BN;
    endTime: BN;
    cancelable: boolean;
  }
) {
  const [streamPDA] = getStreamPDA(creator, params.recipient, params.streamId);
  const [escrowAuthority] = getEscrowAuthorityPDA(streamPDA);
  const escrowTokenAccount = Keypair.generate();
  const creatorTokenAccount = getAssociatedTokenAddressSync(params.mint, creator);

  const tx = await program.methods
    .createStream(
      params.streamId,
      params.recipient,
      params.totalAmount,
      params.startTime,
      params.cliffTime,
      params.endTime,
      params.cancelable,
      false // milestoneBased
    )
    .accounts({
      creator,
      stream: streamPDA,
      mint: params.mint,
      creatorTokenAccount,
      escrowAuthority,
      escrowTokenAccount: escrowTokenAccount.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([escrowTokenAccount])
    .transaction();

  return { tx, signers: [escrowTokenAccount] };
}

export async function withdrawTx(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  recipient: PublicKey,
  streamPDA: PublicKey,
  streamData: { mint: PublicKey; escrowTokenAccount: PublicKey; escrowBump: number }
) {
  const [escrowAuthority] = getEscrowAuthorityPDA(streamPDA);
  const recipientTokenAccount = getAssociatedTokenAddressSync(streamData.mint, recipient);

  return program.methods
    .withdraw()
    .accounts({
      recipient,
      stream: streamPDA,
      mint: streamData.mint,
      escrowAuthority,
      escrowTokenAccount: streamData.escrowTokenAccount,
      recipientTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}

export async function cancelStreamTx(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  creator: PublicKey,
  streamPDA: PublicKey,
  streamData: { recipient: PublicKey; mint: PublicKey; escrowTokenAccount: PublicKey }
) {
  const [escrowAuthority] = getEscrowAuthorityPDA(streamPDA);
  const creatorTokenAccount = getAssociatedTokenAddressSync(streamData.mint, creator);
  const recipientTokenAccount = getAssociatedTokenAddressSync(streamData.mint, streamData.recipient);

  return program.methods
    .cancelStream()
    .accounts({
      creator,
      recipientAuthority: streamData.recipient,
      stream: streamPDA,
      mint: streamData.mint,
      escrowAuthority,
      escrowTokenAccount: streamData.escrowTokenAccount,
      creatorTokenAccount,
      recipientTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}

export async function setMilestoneTx(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  creator: PublicKey,
  streamPDA: PublicKey
) {
  return program.methods
    .setMilestone()
    .accounts({
      creator,
      stream: streamPDA,
    })
    .transaction();
}

export async function closeStreamTx(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  creator: PublicKey,
  streamPDA: PublicKey,
  streamData: { escrowTokenAccount: PublicKey }
) {
  const [escrowAuthority] = getEscrowAuthorityPDA(streamPDA);

  return program.methods
    .closeStream()
    .accounts({
      creator,
      stream: streamPDA,
      escrowTokenAccount: streamData.escrowTokenAccount,
      escrowAuthority,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
}
