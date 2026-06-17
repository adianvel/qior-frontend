import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { IDL } from "./idl";
import { PROGRAM_ID_STRING } from "@/lib/env";
import type { StreamAccount, VestingType } from "./types";

export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
export const LEGACY_STREAM_ACCOUNT_SIZE = 196;

const CREATE_STREAM_DISCRIMINATOR = [71, 188, 111, 127, 108, 40, 229, 158];
const CREATE_STREAM_VESTING_TYPE_OFFSET = 8 + 8 + 32 + 8 + 8 + 8 + 8 + 1;
const CREATE_STREAM_MILESTONE_TIME_OFFSET = CREATE_STREAM_VESTING_TYPE_OFFSET + 1;
const LEGACY_VESTING_CACHE_PREFIX = `qior:${PROGRAM_ID_STRING}:legacy-vesting:v1`;

type LegacyVestingMetadata = { vestingType: VestingType; milestoneTime: number };

const legacyVestingMetadataCache = new Map<string, LegacyVestingMetadata>();
const legacyVestingMetadataRequests = new Map<string, Promise<LegacyVestingMetadata | null>>();

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
    readVestingType(): VestingType {
      const value = data[offset];
      offset += 1;

      if (value === 0) return "cliff";
      if (value === 1) return "linear";
      if (value === 2) return "milestone";

      throw new Error(`Invalid vesting type: ${value}`);
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
    cancelable: false,
    canceled: false,
    vestingType: "linear" as VestingType,
    onChainVestingType: "linear" as VestingType,
    vestingTypeSource: "account" as const,
    milestoneReached: false,
    milestoneTime: 0,
    bump: 0,
    escrowBump: 0,
    createdAt: 0,
  };

  const remaining = data.length - reader.offset;

  // The devnet program has had a few Stream account layouts. Decode by the
  // remaining bytes instead of assuming the newest enum layout for every account.
  if (remaining >= 22) {
    stream.cancelable = reader.readBool();
    stream.canceled = reader.readBool();
    stream.vestingType = reader.readVestingType();
    stream.onChainVestingType = stream.vestingType;
    stream.milestoneReached = reader.readBool();
    stream.milestoneTime = reader.readI64();
    stream.bump = reader.readU8();
    stream.escrowBump = reader.readU8();
    stream.createdAt = reader.readI64();

    return stream;
  }

  if (remaining >= 14) {
    stream.cancelable = reader.readBool();
    stream.canceled = reader.readBool();
    const legacyMilestoneBased = reader.readBool();
    stream.vestingType = legacyMilestoneBased ? "milestone" : "linear";
    stream.onChainVestingType = stream.vestingType;
    stream.milestoneReached = reader.readBool();
    stream.bump = reader.readU8();
    stream.escrowBump = reader.readU8();
    stream.createdAt = reader.readI64();

    return stream;
  }

  if (remaining >= 12) {
    stream.cancelable = reader.readBool();
    const legacyMilestoneBased = reader.readBool();
    stream.vestingType = legacyMilestoneBased ? "milestone" : "linear";
    stream.onChainVestingType = stream.vestingType;
    stream.milestoneReached = legacyMilestoneBased;
    stream.bump = reader.readU8();
    stream.escrowBump = reader.readU8();
    stream.createdAt = reader.readI64();

    return stream;
  }

  return stream;
}

function readInstructionI64(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return Number(view.getBigInt64(offset, true));
}

function readCreateStreamVestingMetadata(data: Uint8Array): LegacyVestingMetadata | null {
  if (data.length < CREATE_STREAM_MILESTONE_TIME_OFFSET + 8) return null;

  const hasCreateStreamDiscriminator = CREATE_STREAM_DISCRIMINATOR.every((byte, index) => data[index] === byte);
  if (!hasCreateStreamDiscriminator) return null;

  const value = data[CREATE_STREAM_VESTING_TYPE_OFFSET];
  const milestoneTime = readInstructionI64(data, CREATE_STREAM_MILESTONE_TIME_OFFSET);
  if (value === 0) return { vestingType: "cliff", milestoneTime };
  if (value === 1) return { vestingType: "linear", milestoneTime };
  if (value === 2) return { vestingType: "milestone", milestoneTime };

  return null;
}

function getLegacyVestingCacheKey(stream: PublicKey) {
  return `${LEGACY_VESTING_CACHE_PREFIX}:${stream.toBase58()}`;
}

export function getCachedLegacyVestingMetadata(stream: PublicKey): LegacyVestingMetadata | null {
  const streamAddress = stream.toBase58();
  const memoryValue = legacyVestingMetadataCache.get(streamAddress);
  if (memoryValue) return memoryValue;

  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(getLegacyVestingCacheKey(stream));
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<LegacyVestingMetadata>;
    if (
      (parsed.vestingType === "cliff" || parsed.vestingType === "linear" || parsed.vestingType === "milestone")
      && typeof parsed.milestoneTime === "number"
    ) {
      const metadata = {
        vestingType: parsed.vestingType,
        milestoneTime: parsed.milestoneTime,
      };
      legacyVestingMetadataCache.set(streamAddress, metadata);
      return metadata;
    }
  } catch {
    return null;
  }

  return null;
}

export function cacheLegacyVestingMetadata(stream: PublicKey, metadata: LegacyVestingMetadata) {
  const streamAddress = stream.toBase58();
  legacyVestingMetadataCache.set(streamAddress, metadata);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getLegacyVestingCacheKey(stream), JSON.stringify(metadata));
  } catch {
    // Cache writes are best-effort; the dashboard can still recover through RPC.
  }
}

export async function recoverLegacyVestingMetadata(
  connection: Connection,
  stream: PublicKey
): Promise<LegacyVestingMetadata | null> {
  const cachedMetadata = getCachedLegacyVestingMetadata(stream);
  if (cachedMetadata) return cachedMetadata;

  const streamAddress = stream.toBase58();
  const existingRequest = legacyVestingMetadataRequests.get(streamAddress);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const signatures = await connection.getSignaturesForAddress(stream, { limit: 10 });

    for (const signatureInfo of signatures) {
      const tx = await connection.getTransaction(signatureInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!tx) continue;

      const accountKeys = tx.transaction.message.staticAccountKeys;
      for (const instruction of tx.transaction.message.compiledInstructions) {
        const programId = accountKeys[instruction.programIdIndex];
        if (!programId?.equals(PROGRAM_ID)) continue;

        const vestingMetadata = readCreateStreamVestingMetadata(instruction.data);
        if (vestingMetadata) {
          cacheLegacyVestingMetadata(stream, vestingMetadata);
          return vestingMetadata;
        }
      }
    }

    return null;
  })().finally(() => {
    legacyVestingMetadataRequests.delete(streamAddress);
  });

  legacyVestingMetadataRequests.set(streamAddress, request);
  return request;
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
    vestingType: VestingType;
    milestoneTime: BN;
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
        toAnchorVestingType(params.vestingType),
        params.milestoneTime
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

  return { tx, signers: [escrowTokenAccount], streamPDA };
}

function toAnchorVestingType(vestingType: VestingType) {
  if (vestingType === "cliff") return { cliff: {} };
  if (vestingType === "linear") return { linear: {} };

  return { milestone: {} };
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
