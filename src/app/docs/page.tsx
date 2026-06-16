import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";
import {
  DocBlock,
  Decision,
  DocsShell,
  StartCard,
  type SidebarGroup,
  type TocItem,
} from "@/components/docs/DocsShell";

const GITHUB_URL = "https://github.com/mancer-team2/frontend";

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Getting Started",
    links: [
      { href: "#introduction", label: "Introduction" },
      { href: "#installation", label: "Installation" },
      { href: "#environment", label: "Environment" },
    ],
  },
  {
    title: "Frontend Integration",
    links: [
      { href: "#client", label: "Anchor Client" },
      { href: "#addresses", label: "Program Derived Addresses" },
      { href: "#create-stream", label: "Create Stream" },
      { href: "#vesting-types", label: "Vesting Types" },
    ],
  },
  {
    title: "Program Calls",
    links: [
      { href: "#instruction-reference", label: "Instruction Reference" },
      { href: "#errors", label: "Errors" },
      { href: "#decisions", label: "Architecture Decisions" },
    ],
  },
];

const onThisPage: TocItem[] = [
  { href: "#where-to-start", label: "Where to start?" },
  { href: "#installation", label: "Install and run" },
  { href: "#client", label: "Create a client" },
  { href: "#create-stream", label: "Create a stream" },
  { href: "#instruction-reference", label: "Program calls" },
  { href: "#decisions", label: "Decisions" },
];

const programCalls = [
  ["createStream", "Creator", "Locks SPL tokens in escrow and writes the vesting schedule."],
  ["withdraw", "Recipient", "Claims currently vested tokens from escrow."],
  ["cancelStream", "Creator", "Cancels a cancelable stream and settles vested/unvested tokens."],
  ["setMilestone", "Creator", "Marks a milestone stream as reached."],
  ["closeStream", "Creator", "Closes a fully settled stream and escrow token account."],
];

const errors = [
  "InvalidAmount",
  "InvalidSchedule",
  "InvalidCliff",
  "InvalidMilestoneTime",
  "NothingToWithdraw",
  "StreamNotCancelable",
  "NotMilestoneStream",
];

const setupCode = `git clone https://github.com/mancer-team2/frontend.git
cd frontend
npm install
npm run dev`;

const envCode = `NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY`;

const clientCode = `import { Connection } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/anchor/program";

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, "confirmed");
const wallet = useAnchorWallet();

if (!wallet) throw new Error("Connect a wallet first");

const program = getProgram(connection, wallet);`;

const pdaCode = `import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getEscrowAuthorityPDA, getStreamPDA } from "@/lib/anchor/program";

const streamId = new BN(Date.now());
const recipient = new PublicKey("RECIPIENT_WALLET_ADDRESS");

const [streamPDA] = getStreamPDA(wallet.publicKey, recipient, streamId);
const [escrowAuthority] = getEscrowAuthorityPDA(streamPDA);`;

const createCode = `import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { createStreamTx } from "@/lib/anchor/program";

const now = Math.floor(Date.now() / 1000);

const { tx, signers } = await createStreamTx(program, wallet.publicKey, {
  streamId: new BN(Date.now()),
  recipient: new PublicKey("RECIPIENT_WALLET_ADDRESS"),
  mint: new PublicKey("SPL_TOKEN_MINT"),
  totalAmount: new BN("1000000"),
  startTime: new BN(now),
  cliffTime: new BN(now),
  endTime: new BN(now + 30 * 24 * 60 * 60),
  cancelable: true,
  vestingType: "linear",
  milestoneTime: new BN(0),
});

const signature = await sendTransaction(tx, connection, { signers });
await connection.confirmTransaction(signature, "confirmed");`;

const vestingCode = `// Cliff
{ vestingType: "cliff", startTime: unlockTime - 1, cliffTime: unlockTime, endTime: unlockTime, milestoneTime: 0 }

// Linear
{ vestingType: "linear", startTime, cliffTime: startTime, endTime, milestoneTime: 0 }

// Milestone
{ vestingType: "milestone", startTime: 0, cliffTime: 0, endTime: 0, milestoneTime }`;

const navLinks = [
  { href: GITHUB_URL, label: "Github" },
  { href: "/docs/programs", label: "Program Docs" },
  { href: "/dashboard/creator", label: "Launch App" },
];

export default function DocsPage() {
  return (
    <DocsShell
      brandLabel="Qior Docs"
      sidebarGroups={sidebarGroups}
      onThisPage={onThisPage}
      githubUrl={GITHUB_URL}
      navLinks={navLinks}
    >
      <section id="introduction" className="scroll-mt-24">
        <h1 className="text-[31px] font-bold leading-tight tracking-normal md:text-[35px]">
          Introduction
        </h1>
        <p className="mt-6 text-[19px] leading-8 text-zinc-600">
          Qior is a token vesting and distribution platform for Solana teams.
        </p>
        <p className="mt-12 text-[16px] leading-7">
          The frontend connects a browser wallet to the Qior Anchor program, builds transactions for SPL token vesting streams, and gives creators and recipients a dashboard for managing unlocks.
        </p>
        <p className="mt-5 text-[16px] leading-7">
          This guide documents the frontend integration path: environment setup, wallet and Anchor client initialization, PDA derivation, stream creation, and the program calls used by the app.
        </p>
      </section>

      <section id="where-to-start" className="mt-12 scroll-mt-24">
        <h2 className="text-[25px] font-bold tracking-normal">Where to start?</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <StartCard icon="install" title="Installation" desc="Set up the frontend locally, configure devnet variables, and run the app." href="#installation" />
          <StartCard icon="integration" title="Integration" desc="Use the same Anchor helpers as the app to create vesting streams." href="#client" />
        </div>
      </section>

      <DocBlock id="installation" title="Installation">
        <p>Install dependencies and start the local Next.js app.</p>
        <CodeBlock code={setupCode} language="bash" filename="terminal" />
      </DocBlock>

      <DocBlock id="environment" title="Environment">
        <p>
          Qior requires public environment variables for the Solana cluster, deployed program ID, and RPC endpoint. The app fails fast when these values are missing.
        </p>
        <CodeBlock code={envCode} language="env" filename=".env.local" />
        <p>
          Use a Helius devnet RPC endpoint from <a href="https://www.helius.dev/" className="font-medium text-violet-700 underline underline-offset-4">helius.dev</a> for more reliable requests than the public Solana endpoint.
        </p>
        <p>
          For the current Qior devnet deployment, use <code>BiwY71TrdBzgv2yfa6KfUxUMY8UCpeiUMGnwmCMTsfs9</code> as the program ID.
        </p>
        <p>
          Use a devnet wallet with SOL for fees and USDC-Dev balance from the <a href="https://spl-token-faucet.com/?token-name=USDC-Dev" className="font-medium text-violet-700 underline underline-offset-4">SPL Token Faucet</a> before testing stream creation.
        </p>
      </DocBlock>

      <DocBlock id="client" title="Create an Anchor client">
        <p>
          The app centralizes provider and program creation in <code>src/lib/anchor/program.ts</code>. Use the exported helper instead of constructing account lists inside page components.
        </p>
        <CodeBlock code={clientCode} language="ts" filename="program-client.ts" />
      </DocBlock>

      <DocBlock id="addresses" title="Derive stream addresses">
        <p>
          Stream accounts use the <code>[&quot;stream&quot;, creator, recipient, stream_id]</code> PDA seed. Escrow authority uses <code>[&quot;escrow_authority&quot;, stream]</code>.
        </p>
        <CodeBlock code={pdaCode} language="ts" filename="stream-pda.ts" />
      </DocBlock>

      <DocBlock id="create-stream" title="Create a stream">
        <p>
          The frontend validates mint data, the creator token account, and token balance before asking the wallet to approve the transaction.
        </p>
        <CodeBlock code={createCode} language="ts" filename="create-stream.ts" />
      </DocBlock>

      <DocBlock id="vesting-types" title="Vesting types">
        <p>
          Qior supports three explicit vesting types. The frontend sends the type as <code>cliff</code>, <code>linear</code>, or <code>milestone</code>; the Anchor client converts it to the required enum object.
        </p>
        <CodeBlock code={vestingCode} language="ts" filename="vesting-types.ts" />
      </DocBlock>

      <DocBlock id="instruction-reference" title="Program calls from the frontend">
        <p>
          This is the frontend-facing reference for the program calls used by Qior. The{" "}
          <Link href="/docs/programs" className="font-medium text-violet-700 underline underline-offset-4">program documentation</Link>{" "}
          remains the canonical source for Rust instruction internals.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {programCalls.map(([name, signer, purpose]) => (
            <div key={name} className="grid gap-3 border-b border-zinc-200 p-5 last:border-b-0 md:grid-cols-[180px_120px_1fr]">
              <code className="font-mono text-[15px] font-semibold">{name}</code>
              <span className="text-[15px] text-zinc-600">{signer}</span>
              <p className="text-[15px] leading-6 text-zinc-700">{purpose}</p>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock id="errors" title="Errors surfaced in the frontend">
        <p>
          The UI maps common wallet, token-account, and Anchor errors into user-facing messages. These program error names are expected from the current integration.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {errors.map((error) => (
            <code key={error} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono text-sm text-zinc-700">
              {error}
            </code>
          ))}
        </div>
      </DocBlock>

      <DocBlock id="decisions" title="Architecture decisions">
        <div className="space-y-7">
          <Decision title="Wallet Adapter plus Anchor client">
            The app uses Wallet Adapter for browser wallet UX and Anchor for method builders, account validation, and transaction construction.
          </Decision>
          <Decision title="Typed frontend program wrapper">
            PDA derivation, account decoding, and transaction builders live in one helper module so UI routes do not duplicate protocol wiring.
          </Decision>
          <Decision title="Explicit vesting enum">
            The frontend sends and decodes a real vesting type. It does not infer Cliff, Linear, or Milestone from timestamps.
          </Decision>
        </div>
      </DocBlock>
    </DocsShell>
  );
}
