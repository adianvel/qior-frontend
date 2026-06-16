# Qior Frontend

Frontend for **Qior**, a Solana token vesting and distribution platform. Qior lets creators lock SPL tokens in escrow and release them to recipients through cliff, linear, or milestone-based vesting schedules on Solana devnet.

## Documentation

Developer documentation is available in the app at:

```txt
/docs
```

The landing page `Explore Qior` button opens this public docs page. It covers frontend setup, wallet and token requirements, Anchor client integration, program calls used by the frontend, vesting type parameters, and frontend architecture decisions.

## Tech Stack

- Next.js 16 with App Router and TypeScript
- Tailwind CSS v4
- Framer Motion
- lucide-react
- Solana Wallet Adapter
- Anchor client
- TanStack Query

## Features

- Public marketing landing page
- Public developer documentation page
- Wallet-gated app shell
- Creator dashboard for created vesting streams
- Recipient dashboard for incoming streams and withdrawals
- Create stream flow for Cliff, Linear, and Milestone vesting
- Stream detail page with withdraw, cancel, milestone, and close actions
- Phantom and Solflare wallet support

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page |
| `/docs` | Developer documentation and frontend integration guide |
| `/dashboard/creator` | Streams created by the connected wallet |
| `/dashboard/recipient` | Streams where the connected wallet is recipient |
| `/create` | Create a new token vesting stream |
| `/streams/[streamId]` | View and manage a stream account |

## Environment

Create `.env.local` for local development and set the same variables in Vercel:

```bash
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

Use a Helius devnet RPC endpoint from [helius.dev](https://www.helius.dev/) for better reliability. The frontend does not provide fallback values for these variables.

For the current Qior devnet deployment, use `BiwY71TrdBzgv2yfa6KfUxUMY8UCpeiUMGnwmCMTsfs9` as `NEXT_PUBLIC_PROGRAM_ID`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test the full create and withdraw flow, use a devnet wallet with:

- Devnet SOL for fees.
- USDC-Dev from the [SPL Token Faucet](https://spl-token-faucet.com/?token-name=USDC-Dev), or another SPL token balance for the selected mint.
- A recipient wallet address.

## Quality Checks

```bash
npm run lint
npm run build
```

Current status:

- Lint passes.
- Production build passes.
- Devnet program ID: `BiwY71TrdBzgv2yfa6KfUxUMY8UCpeiUMGnwmCMTsfs9`.
- End-to-end create, withdraw, cancel, milestone, and close testing requires an interactive devnet wallet.

## Related

- Smart contract repo: [mancer-team2/programs](https://github.com/mancer-team2/programs)
- Frontend repo: [mancer-team2/frontend](https://github.com/mancer-team2/frontend)
