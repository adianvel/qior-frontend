# Qior Frontend

Frontend for **Qior**, a Solana token distribution and vesting protocol. Qior lets creators lock SPL tokens in escrow and release them to recipients through transparent vesting schedules on Solana devnet.

## Tech Stack

- Next.js 16 with App Router and TypeScript
- Tailwind CSS v4
- Framer Motion
- Phosphor Icons
- Solana Wallet Adapter
- Anchor client
- TanStack Query

## Features

- Landing page with 8 product sections
- Wallet-gated app shell
- Creator dashboard for created vesting streams
- Recipient dashboard for incoming streams and withdrawals
- Create-stream form wired to the on-chain program
- Stream detail page with on-chain account loading and cancel action
- Phantom and Solflare wallet support

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page |
| `/dashboard/creator` | Streams created by the connected wallet |
| `/dashboard/recipient` | Streams where the connected wallet is recipient |
| `/create` | Create a new token vesting stream |
| `/streams/[streamId]` | View and manage a stream account |

## Environment

The app requires public environment variables. Create `.env.local` for local development and set the same variables in Vercel:

```bash
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_PROGRAM_ID=BiwY71TrdBzgv2yfa6KfUxUMY8UCpeiUMGnwmCMTsfs9
NEXT_PUBLIC_RPC_URL=<your-devnet-rpc-url>
```

Use a dedicated RPC provider for better reliability. The frontend does not provide fallback values for these variables.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
npm run lint
npm run build
```

Current status:

- Lint passes.
- Production build passes.
- Devnet program is deployed at `BiwY71TrdBzgv2yfa6KfUxUMY8UCpeiUMGnwmCMTsfs9`.
- End-to-end create, withdraw, and cancel testing requires an interactive devnet wallet with SOL and SPL token balance.

## Related

- Smart contract repo: [mancer-team2/programs](https://github.com/mancer-team2/programs)
- Frontend repo: [mancer-team2/frontend](https://github.com/mancer-team2/frontend)
