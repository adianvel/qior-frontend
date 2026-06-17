function requireValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const RPC_URL = requireValue("NEXT_PUBLIC_RPC_URL", process.env.NEXT_PUBLIC_RPC_URL);
export const PROGRAM_ID_STRING = requireValue("NEXT_PUBLIC_PROGRAM_ID", process.env.NEXT_PUBLIC_PROGRAM_ID);
export const SOLANA_CLUSTER = requireValue("NEXT_PUBLIC_SOLANA_CLUSTER", process.env.NEXT_PUBLIC_SOLANA_CLUSTER);
export const IS_MAINNET = SOLANA_CLUSTER === "mainnet" || SOLANA_CLUSTER === "mainnet-beta";
export const IS_LEGACY_RECOVERY_ENABLED = !IS_MAINNET;
