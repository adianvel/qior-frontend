import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { IDL } from "./idl";
import { PROGRAM_ID_STRING } from "@/lib/env";

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
