export function getRequiredPublicEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const RPC_URL = getRequiredPublicEnv("NEXT_PUBLIC_RPC_URL");
export const PROGRAM_ID_STRING = getRequiredPublicEnv("NEXT_PUBLIC_PROGRAM_ID");
export const SOLANA_CLUSTER = getRequiredPublicEnv("NEXT_PUBLIC_SOLANA_CLUSTER");
