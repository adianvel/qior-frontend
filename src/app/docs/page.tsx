"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Check,
  Clipboard,
  Code2,
  GitBranch,
  List,
  Moon,
  PanelLeft,
  Search,
  Sun,
  Terminal,
  Wrench,
} from "lucide-react";

const sidebarGroups = [
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

const onThisPage = [
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

export default function DocsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Getting Started": true,
    "Frontend Integration": true,
    "Program Calls": true,
  });
  const isDark = theme === "dark";

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const storedTheme = window.localStorage.getItem("qior-docs-theme");
      if (storedTheme === "dark") {
        setTheme("dark");
      }
    });
  }, []);

  function setDocsTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    window.localStorage.setItem("qior-docs-theme", nextTheme);
  }

  function toggleGroup(groupTitle: string) {
    setOpenGroups((current) => ({
      ...current,
      [groupTitle]: !current[groupTitle],
    }));
  }

  return (
    <main className={`qior-docs-page ${isDark ? "qior-docs-dark" : ""} min-h-screen bg-[#f7f7f7] text-black`}>
      <aside className={`fixed inset-y-0 left-0 z-20 hidden border-r border-zinc-200 bg-[#f7f7f7] transition-[width] duration-200 lg:block ${sidebarOpen ? "w-[285px]" : "w-[72px]"}`}>
        <div className="flex h-15 items-center justify-between border-b border-zinc-200 px-5">
          <Link href="/" className={`flex min-w-0 items-center gap-3 text-[17px] font-semibold ${sidebarOpen ? "" : "pointer-events-none"}`}>
            <Image
              src="/logo-qior.avif"
              alt="Qior"
              width={82}
              height={28}
              priority
              className="h-8 w-auto"
            />
            {sidebarOpen ? <span className="whitespace-nowrap">Qior Docs</span> : null}
          </Link>
          <button
            type="button"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={!sidebarOpen}
            onClick={() => setSidebarOpen((current) => !current)}
            className="cursor-pointer rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200/70"
          >
            <PanelLeft size={20} />
          </button>
        </div>

        <nav className={`h-[calc(100vh-60px)] overflow-y-auto py-5 ${sidebarOpen ? "px-5" : "px-3"}`}>
          {sidebarGroups.map((group) => (
            <div key={group.title} className="mb-7">
              {sidebarOpen ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="mb-2.5 flex w-full cursor-pointer items-center justify-between rounded-md text-left text-[14px] font-semibold text-black hover:text-zinc-700"
                  aria-expanded={openGroups[group.title]}
                >
                  <span>{group.title}</span>
                  <ChevronDown size={16} className={`text-zinc-500 transition-transform ${openGroups[group.title] ? "" : "-rotate-90"}`} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label={`Open ${group.title}`}
                  className="mb-5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-200/70"
                >
                  <ChevronDown size={16} />
                </button>
              )}
              {sidebarOpen && openGroups[group.title] ? <div className="space-y-1">
                {group.links.map((link, index) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between rounded-md py-1.5 text-[14px] leading-6 transition-colors hover:text-black ${
                      index === 0 ? "font-medium text-black" : "text-zinc-600"
                    }`}
                  >
                    <span className={index > 0 ? "pl-5" : ""}>{link.label}</span>
                  </a>
                ))}
              </div> : null}
            </div>
          ))}
        </nav>
      </aside>

      <div className={`transition-[padding] duration-200 ${sidebarOpen ? "lg:pl-[285px]" : "lg:pl-[72px]"}`}>
        <header className="sticky top-0 z-10 flex h-15 items-center justify-between border-b border-zinc-200 bg-[#f7f7f7]/95 px-5 backdrop-blur md:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold lg:hidden">
              <Image
                src="/logo-qior.avif"
                alt="Qior"
                width={72}
                height={24}
                priority
                className="h-7 w-auto"
              />
              Qior Docs
            </Link>
            <div className="hidden h-9 w-[285px] items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-zinc-500 shadow-sm md:flex">
              <Search size={17} />
              <span className="text-[15px]">Search</span>
              <span className="ml-auto rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">Ctrl K</span>
            </div>
            <nav className="hidden items-center gap-7 text-[15px] text-zinc-600 md:flex">
              <a href="https://github.com/mancer-team2/frontend" className="hover:text-black">Github</a>
              <Link href="/dashboard/creator" className="hover:text-black">Launch App</Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/creator" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/70 md:hidden">
              App
            </Link>
            <div className="flex rounded-full border border-zinc-200 bg-zinc-100 p-1">
              <button
                type="button"
                aria-label="Light theme"
                aria-pressed={!isDark}
                onClick={() => setDocsTheme("light")}
                className={`cursor-pointer rounded-full p-2 transition-colors ${!isDark ? "bg-zinc-200 text-black" : "text-zinc-500 hover:text-black"}`}
              >
                <Sun size={17} />
              </button>
              <button
                type="button"
                aria-label="Dark theme"
                aria-pressed={isDark}
                onClick={() => setDocsTheme("dark")}
                className={`cursor-pointer rounded-full p-2 transition-colors ${isDark ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-black"}`}
              >
                <Moon size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="mx-auto w-full max-w-[880px] px-6 py-10 md:px-11 md:py-12">
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
                This is the frontend-facing reference for the program calls used by Qior. The backend program docs remain the canonical source for Rust instruction internals.
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
          </article>

          <aside className="hidden border-l border-zinc-200 px-7 py-12 xl:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center gap-2 text-[15px] text-zinc-600">
                <List size={17} />
                On this page
              </div>
              <nav className="space-y-3.5 border-l border-zinc-300 pl-5">
                {onThisPage.map((item, index) => (
                  <a key={item.href} href={item.href} className={`block text-[14px] hover:text-black ${index === 0 ? "text-black" : "text-zinc-600"}`}>
                    {item.label}
                  </a>
                ))}
              </nav>
              <a href="https://github.com/mancer-team2/frontend" className="mt-6 flex items-center gap-3 text-[15px] text-zinc-600 hover:text-black">
                <GitBranch size={19} />
                Edit on GitHub
              </a>
              <Link href="/dashboard/creator" className="mt-6 inline-flex items-center gap-1.5 text-[15px] text-zinc-600 hover:text-black">
                Launch App <ArrowUpRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StartCard({ icon, title, desc, href }: { icon: "install" | "integration"; title: string; desc: string; href: string }) {
  const Icon = icon === "install" ? Wrench : Code2;

  return (
    <a href={href} className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300">
      <div className="mb-4 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-violet-500">
        <Icon size={15} />
      </div>
      <h3 className="text-[15px] font-bold">{title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-zinc-600">{desc}</p>
    </a>
  );
}

function DocBlock({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="text-[24px] font-bold tracking-normal">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-zinc-700">{children}</div>
    </section>
  );
}

function CodeBlock({ code, language, filename }: { code: string; language: "bash" | "env" | "ts"; filename: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-[#f4f4f5] shadow-sm">
      <div className="flex h-10 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4">
        <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-600">
          <Terminal size={15} />
          <span>{filename}</span>
          <LanguageIcon language={language} />
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-zinc-950"
        >
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#fafafa] p-4 text-[12px] leading-5 text-zinc-950">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </pre>
    </div>
  );
}

function LanguageIcon({ language }: { language: "bash" | "env" | "ts" }) {
  if (language === "ts") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#3178c6] text-[10px] font-bold leading-none text-white" title="TypeScript">
        TS
      </span>
    );
  }

  if (language === "env") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white" title="Environment">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
          <path fill="currentColor" d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 14.5v-9Zm4 1.25a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Zm3.75 0a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Zm3.75 0a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-white" title="Shell">
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
        <path fill="currentColor" d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 14.5v-9Zm4.03 2.47a.75.75 0 0 0-1.06 1.06L7.94 11l-1.97 1.97a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5ZM10.75 13a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" />
      </svg>
    </span>
  );
}

function highlightCode(code: string, language: "bash" | "env" | "ts") {
  const escaped = escapeHtml(code);

  if (language === "env") {
    return escaped.replace(/^([A-Z0-9_]+)(=)(.*)$/gm, '<span class="text-rose-600">$1</span><span class="text-zinc-500">$2</span><span class="text-blue-700">$3</span>');
  }

  if (language === "bash") {
    return escaped
      .replace(/^(#.*)$/gm, '<span class="text-zinc-500">$1</span>')
      .replace(/\b(git|cd|npm)\b/g, '<span class="text-violet-700">$1</span>');
  }

  return escaped
    .replace(/(\/\/.*)$/gm, '<span class="text-zinc-500">$1</span>')
    .replace(/\b(import|from|const|await|new|if|throw)\b/g, '<span class="text-violet-700">$1</span>')
    .replace(/\b(Connection|PublicKey|BN|Error)\b/g, '<span class="text-amber-700">$1</span>')
    .replace(/(&quot;[^&]*?&quot;)/g, '<span class="text-blue-700">$1</span>')
    .replace(/\b(true|false)\b/g, '<span class="text-rose-600">$1</span>');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function Decision({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-black">{title}</h3>
      <p className="mt-2 text-[15px] leading-7 text-zinc-700">{children}</p>
    </div>
  );
}
