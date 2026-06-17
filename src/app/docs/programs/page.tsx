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

const GITHUB_URL = "https://github.com/mancer-team2/programs";
const PROGRAM_ID = "BiwY71TrdBzgv2yfa6KfUxUMY8UCpeiUMGnwmCMTsfs9";

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Getting Started",
    links: [
      { href: "#introduction", label: "Introduction" },
      { href: "#prerequisites", label: "Prerequisites" },
      { href: "#build", label: "Build & Deploy" },
      { href: "#testing", label: "Testing" },
    ],
  },
  {
    title: "Program Model",
    links: [
      { href: "#stream-account", label: "Stream Account" },
      { href: "#vesting-types", label: "Vesting Types" },
      { href: "#pdas", label: "PDAs & Escrow" },
    ],
  },
  {
    title: "Instructions",
    links: [
      { href: "#lifecycle", label: "Lifecycle" },
      { href: "#create-stream", label: "create_stream" },
      { href: "#withdraw", label: "withdraw" },
      { href: "#set-milestone", label: "set_milestone" },
      { href: "#cancel-stream", label: "cancel_stream" },
      { href: "#close-stream", label: "close_stream" },
    ],
  },
  {
    title: "Reference",
    links: [
      { href: "#vesting-math", label: "Vesting Math" },
      { href: "#errors", label: "Errors" },
      { href: "#decisions", label: "Architecture Decisions" },
    ],
  },
];

const onThisPage: TocItem[] = [
  { href: "#introduction", label: "Introduction" },
  { href: "#build", label: "Build & deploy" },
  { href: "#stream-account", label: "Stream account" },
  { href: "#create-stream", label: "Instructions" },
  { href: "#vesting-math", label: "Vesting math" },
  { href: "#errors", label: "Errors" },
];

const navLinks = [
  { href: GITHUB_URL, label: "Github" },
  { href: "/docs", label: "Frontend Docs" },
  { href: "/dashboard/creator", label: "Launch App" },
];

const instructions = [
  ["create_stream", "Creator", "Locks tokens in a PDA escrow and writes the vesting schedule."],
  ["withdraw", "Recipient", "Transfers currently vested tokens from escrow to the recipient."],
  ["set_milestone", "Creator", "Flips the milestone flag, unlocking a milestone-based stream."],
  ["cancel_stream", "Creator", "Settles a cancelable stream: vested → recipient, locked → creator."],
  ["close_stream", "Creator", "Closes a drained, fully settled stream and reclaims rent."],
];

const lifecycleSteps = [
  {
    step: "1",
    title: "Create",
    call: "create_stream",
    body: "The creator locks total_amount in a fresh PDA escrow and writes the schedule. The stream starts with withdrawn_amount = 0 and canceled = false.",
  },
  {
    step: "2",
    title: "Unlock & withdraw",
    call: "withdraw",
    body: "As tokens vest, the recipient claims them — repeatedly, across any number of calls. Each claim adds to withdrawn_amount. For milestone streams the creator first calls set_milestone to release the full amount.",
  },
  {
    step: "3",
    title: "Cancel (optional)",
    call: "cancel_stream",
    body: "While a cancelable stream is still partly locked, the creator can settle it early: vested-but-unclaimed tokens go to the recipient, still-locked tokens return to the creator, and canceled is set to true.",
  },
  {
    step: "4",
    title: "Close",
    call: "close_stream",
    body: "Once the escrow is empty and the stream is settled (fully withdrawn, or canceled), the creator closes the escrow and Stream accounts and reclaims the rent.",
  },
];

const errors = [
  ["InvalidAmount", "Amount must be greater than zero"],
  ["InvalidRecipient", "Recipient cannot be the default pubkey"],
  ["InvalidSchedule", "start_time must be before end_time"],
  ["InvalidCliff", "cliff_time must be between start_time and end_time"],
  ["InvalidMilestoneTime", "milestone_time must be greater than zero"],
  ["CliffNotReached", "Cliff period has not been reached yet"],
  ["NothingToWithdraw", "No tokens available to withdraw"],
  ["Unauthorized", "Signer is not authorized for this action"],
  ["AlreadyCancelled", "Stream has already been canceled"],
  ["StreamNotCancelable", "Stream is not cancelable"],
  ["FullyVested", "Stream is already fully vested"],
  ["NotMilestoneStream", "Stream is not configured for milestone unlocking"],
  ["StreamExpired", "Stream schedule has already ended"],
  ["StreamNotSettled", "Stream is not fully settled yet"],
  ["InvalidTokenAccount", "Token account mint does not match stream mint"],
  ["InsufficientFunds", "Insufficient token balance to fund stream"],
  ["InvalidPda", "PDA derivation does not match expected address"],
  ["MathOverflow", "Arithmetic overflow or underflow"],
];

const prereqCode = `rustc --version
solana --version
anchor --version   # v0.31.x
node --version     # v18+
yarn --version`;

const buildCode = `git clone https://github.com/mancer-team2/programs.git
cd programs
yarn install

anchor build        # compiles the program + generates the keypair
anchor keys sync    # writes the program ID into lib.rs and Anchor.toml`;

const deployCode = `solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet`;

const testCode = `# Pure-logic unit tests always run.
# LiteSVM integration tests need the compiled .so, so build first.
anchor build
cargo test`;

const streamAccountCode = `#[account]
#[derive(InitSpace)]
pub struct Stream {
    pub creator: Pubkey,              // funded the escrow, may cancel/close
    pub recipient: Pubkey,            // entitled to withdraw vested tokens
    pub mint: Pubkey,                 // SPL token being vested
    pub escrow_token_account: Pubkey, // PDA-owned escrow holding the tokens
    pub stream_id: u64,               // creator-scoped id, used in the PDA seed
    pub total_amount: u64,            // tokens originally deposited
    pub withdrawn_amount: u64,        // cumulative amount already claimed
    pub start_time: i64,              // unix ts vesting begins
    pub cliff_time: i64,              // nothing claimable before this ts
    pub end_time: i64,                // unix ts at 100% unlocked
    pub cancelable: bool,             // creator allowed to cancel
    pub canceled: bool,               // stream has been canceled
    pub vesting_type: VestingType,    // Cliff | Linear | Milestone
    pub milestone_reached: bool,      // milestone flag (milestone vesting only)
    pub milestone_time: i64,          // gate ts for milestone unlock
    pub bump: u8,                     // Stream PDA bump
    pub escrow_bump: u8,              // escrow authority PDA bump
    pub created_at: i64,              // unix ts the account was created
}`;

const vestingEnumCode = `#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VestingType {
    Cliff,      // all-or-nothing at end_time (cliff_time == end_time)
    Linear,     // proportional over [start_time, end_time] (cliff_time == start_time)
    Milestone,  // all-at-once once the creator marks the milestone reached
}`;

const pdaCode = `// Stream account PDA
seeds = [
    b"stream",
    creator.key().as_ref(),
    recipient.as_ref(),
    &stream_id.to_le_bytes(),
]

// Escrow authority PDA — owns the escrow token account.
// Only the program can sign for it (no private key).
seeds = [b"escrow_authority", stream.key().as_ref()]`;

const createSigCode = `pub fn create_stream(
    ctx: Context<CreateStream>,
    stream_id: u64,
    recipient: Pubkey,
    total_amount: u64,
    start_time: i64,
    cliff_time: i64,
    end_time: i64,
    cancelable: bool,
    vesting_type: VestingType,
    milestone_time: i64,
) -> Result<()>`;

const createValidateCode = `require!(total_amount > 0, VestingError::InvalidAmount);
require!(recipient != Pubkey::default(), VestingError::InvalidRecipient);
match vesting_type {
    VestingType::Cliff => {
        require!(start_time < end_time, VestingError::InvalidSchedule);
        require!(cliff_time == end_time, VestingError::InvalidCliff);
    }
    VestingType::Linear => {
        require!(start_time < end_time, VestingError::InvalidSchedule);
        require!(cliff_time == start_time, VestingError::InvalidCliff);
    }
    VestingType::Milestone => {
        require!(milestone_time > 0, VestingError::InvalidMilestoneTime);
    }
}
require!(creator_token_balance >= total_amount, VestingError::InsufficientFunds);`;

const withdrawCode = `// 1. Recompute what has vested right now.
let vested = calculate_vested_amount_by_type(/* schedule + vesting_type */, now)?;
// 2. Subtract what was already claimed.
let withdrawable = vested.checked_sub(stream.withdrawn_amount)?;
require!(withdrawable > 0, VestingError::NothingToWithdraw);
// 3. Effects before interactions: bump the claimed total first.
stream.withdrawn_amount = stream.withdrawn_amount.checked_add(withdrawable)?;
// 4. PDA-signed transfer escrow -> recipient ATA.
token::transfer(/* escrow_authority signs */, withdrawable)?;`;

const cancelCode = `// to_recipient = vested - withdrawn   (unlocked but not yet claimed)
// to_creator   = total  - vested      (still locked)
pub fn split_cancel_amounts(
    total_amount: u64,
    vested_amount: u64,
    withdrawn_amount: u64,
) -> Result<(u64, u64)> {
    let to_recipient = vested_amount.checked_sub(withdrawn_amount)?;
    let to_creator = total_amount.checked_sub(vested_amount)?;
    Ok((to_recipient, to_creator))
}`;

const vestingMathCode = `// Linear: 0 before the cliff, total after end_time, else proportional.
if current_time < cliff_time { return Ok(0); }
if current_time >= end_time  { return Ok(total_amount); }

let elapsed  = (current_time - start_time) as u128;
let duration = (end_time - start_time) as u128;
let vested   = (total_amount as u128) * elapsed / duration; // all checked_*

// Cliff: total once current_time >= end_time, otherwise 0.
// Milestone: total once milestone_reached && current_time >= milestone_time.`;

export default function ProgramDocsPage() {
  return (
    <DocsShell
      brandLabel="Qior Docs"
      sidebarGroups={sidebarGroups}
      onThisPage={onThisPage}
      githubUrl={GITHUB_URL}
      navLinks={navLinks}
    >
      <section id="introduction" className="scroll-mt-24">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-violet-600">Program reference</p>
        <h1 className="mt-2 text-[31px] font-bold leading-tight tracking-normal md:text-[35px]">
          tdp-solana
        </h1>
        <p className="mt-6 text-[19px] leading-8 text-zinc-600">
          The on-chain Anchor program behind Qior — it locks SPL tokens in escrow and releases them on a vesting schedule.
        </p>
        <p className="mt-12 text-[16px] leading-7">
          <code>tdp-solana</code> is a token vesting program written in Rust with <a href="https://www.anchor-lang.com/" className="font-medium text-violet-700 underline underline-offset-4">Anchor</a>. A creator locks tokens on-chain for a recipient, and the program releases them over time according to a schedule — no party has to trust the other, because the program holds the tokens and enforces the rules.
        </p>
        <p className="mt-5 text-[16px] leading-7">
          It supports three distribution patterns: <strong>cliff</strong> and <strong>linear</strong> time-based vesting, <strong>milestone</strong> vesting (full unlock when the creator marks a milestone reached), and <strong>cancellation</strong> (vested tokens go to the recipient, still-locked tokens return to the creator). This page is the canonical reference for the program internals; the{" "}
          <Link href="/docs" className="font-medium text-violet-700 underline underline-offset-4">frontend docs</Link>{" "}
          cover the integration path.
        </p>
        <p className="mt-5 text-[16px] leading-7">
          Devnet program ID: <code>{PROGRAM_ID}</code>
        </p>
      </section>

      <section id="where-to-start" className="mt-12 scroll-mt-24">
        <h2 className="text-[25px] font-bold tracking-normal">Where to start?</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <StartCard icon="install" title="Build & Deploy" desc="Install the toolchain, build the program, and deploy it to devnet." href="#prerequisites" />
          <StartCard icon="integration" title="Instructions" desc="Read the five instructions, their signers, accounts, and checks." href="#create-stream" />
        </div>
      </section>

      <DocBlock id="prerequisites" title="Prerequisites">
        <p>
          You need the Rust toolchain, the Solana CLI, Anchor CLI <code>v0.31.x</code>, and Node.js (v18+) with yarn. Verify each tool is installed:
        </p>
        <CodeBlock code={prereqCode} language="bash" filename="terminal" />
      </DocBlock>

      <DocBlock id="build" title="Build & deploy">
        <p>
          Clone the repo, install the JS dependencies (used by the test harness), then build. The first build generates a program keypair at <code>target/deploy/tdp_solana-keypair.json</code>; <code>anchor keys sync</code> writes that ID into <code>lib.rs</code> and <code>Anchor.toml</code>.
        </p>
        <CodeBlock code={buildCode} language="bash" filename="terminal" />
        <p>Point the CLI at devnet, fund the wallet, and deploy:</p>
        <CodeBlock code={deployCode} language="bash" filename="terminal" />
      </DocBlock>

      <DocBlock id="testing" title="Testing">
        <p>
          The suite is pure-logic unit tests plus LiteSVM integration tests. The integration tests need the compiled <code>.so</code>, so run <code>anchor build</code> first — if the artifact is missing the LiteSVM tests skip themselves and the unit tests still run.
        </p>
        <CodeBlock code={testCode} language="bash" filename="terminal" />
      </DocBlock>

      <DocBlock id="stream-account" title="Stream account">
        <p>
          A single <code>Stream</code> account holds the entire state of a vesting stream: the parties, the escrow, the schedule, and the bookkeeping for what has been withdrawn. It is a PDA, so its address is deterministic and the program can sign for the escrow it owns.
        </p>
        <CodeBlock code={streamAccountCode} language="rust" filename="state/stream.rs" />
      </DocBlock>

      <DocBlock id="vesting-types" title="Vesting types">
        <p>
          The vesting rule is an explicit enum stored on the stream — the program never infers it from timestamps. Each variant constrains how the schedule fields are validated at creation and how the unlocked amount is computed at withdrawal.
        </p>
        <CodeBlock code={vestingEnumCode} language="rust" filename="state/stream.rs" />
      </DocBlock>

      <DocBlock id="pdas" title="PDAs & escrow">
        <p>
          Each stream is keyed by <code>(creator, recipient, stream_id)</code>, so a creator can run many independent streams to the same recipient. The escrow token account is owned by a second PDA — the <em>escrow authority</em> — which has no private key, so only the program can move the locked tokens.
        </p>
        <CodeBlock code={pdaCode} language="rust" filename="seeds" />
      </DocBlock>

      <DocBlock id="instruction-overview" title="Instructions">
        <p>The program exposes five instructions. The signer column is the wallet that must authorize each call.</p>
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {instructions.map(([name, signer, purpose]) => (
            <div key={name} className="grid gap-3 border-b border-zinc-200 p-5 last:border-b-0 md:grid-cols-[190px_110px_1fr]">
              <code className="font-mono text-[15px] font-semibold">{name}</code>
              <span className="text-[15px] text-zinc-600">{signer}</span>
              <p className="text-[15px] leading-6 text-zinc-700">{purpose}</p>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock id="lifecycle" title="Stream lifecycle">
        <p>
          The five instructions form one flow. A stream moves from creation through withdrawals to a final close; cancellation is an optional early exit for cancelable streams.
        </p>
        <div className="mt-6 space-y-3">
          {lifecycleSteps.map((stage) => (
            <div key={stage.step} className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-[13px] font-semibold text-violet-600">
                {stage.step}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[15px] font-bold">{stage.title}</h3>
                  <code className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[12px] text-zinc-700">{stage.call}</code>
                </div>
                <p className="mt-2 text-[14px] leading-6 text-zinc-600">{stage.body}</p>
              </div>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock id="create-stream" title="create_stream">
        <p>
          <strong>Signer: creator.</strong> Initializes the <code>Stream</code> PDA and a fresh escrow token account, then transfers <code>total_amount</code> from the creator&apos;s token account into escrow in the same transaction.
        </p>
        <CodeBlock code={createSigCode} language="rust" filename="instructions/create_stream.rs" />
        <p>Parameters are validated before any tokens move:</p>
        <CodeBlock code={createValidateCode} language="rust" filename="validate_create_stream_params" />
        <p>
          Note the schedule shape per type: <strong>Cliff</strong> requires <code>cliff_time == end_time</code> (all-or-nothing), <strong>Linear</strong> requires <code>cliff_time == start_time</code> (vesting from the start), and <strong>Milestone</strong> only requires <code>milestone_time &gt; 0</code> and ignores start/cliff/end.
        </p>
      </DocBlock>

      <DocBlock id="withdraw" title="withdraw">
        <p>
          <strong>Signer: recipient.</strong> Computes how much has vested at the current time, subtracts what was already claimed, and transfers the difference from escrow to the recipient&apos;s associated token account (created if needed). The escrow authority PDA signs the transfer.
        </p>
        <CodeBlock code={withdrawCode} language="rust" filename="instructions/withdraw.rs" />
        <p>
          Guards: the signer must equal <code>stream.recipient</code> (<code>Unauthorized</code>), the stream must not be canceled (<code>AlreadyCancelled</code>), the mint and escrow must match the stream, and there must be something to claim (<code>NothingToWithdraw</code>). Withdrawals are incremental — the recipient can claim repeatedly as more vests.
        </p>
      </DocBlock>

      <DocBlock id="set-milestone" title="set_milestone">
        <p>
          <strong>Signer: creator.</strong> Marks a milestone-based stream as reached, which unlocks the full amount for withdrawal once <code>current_time &gt;= milestone_time</code>. It only flips a boolean — no tokens move.
        </p>
        <p>
          Guards: the signer must be the creator (<code>Unauthorized</code>), the stream must use <code>VestingType::Milestone</code> (<code>NotMilestoneStream</code>), it must not be canceled (<code>AlreadyCancelled</code>), and the milestone must not already be reached (<code>FullyVested</code>).
        </p>
      </DocBlock>

      <DocBlock id="cancel-stream" title="cancel_stream">
        <p>
          <strong>Signer: creator.</strong> Cancels a cancelable stream and settles the escrow in one call. Vested-but-unclaimed tokens are sent to the recipient; still-locked tokens are returned to the creator. The <code>canceled</code> flag is set before the transfers (effects before interactions).
        </p>
        <CodeBlock code={cancelCode} language="rust" filename="instructions/cancel_stream.rs" />
        <p>
          Guards: the signer must be the creator, the stream must be <code>cancelable</code> (<code>StreamNotCancelable</code>) and not already canceled (<code>AlreadyCancelled</code>), and it must not be fully vested (<code>FullyVested</code>) — there would be nothing left to return.
        </p>
      </DocBlock>

      <DocBlock id="close-stream" title="close_stream">
        <p>
          <strong>Signer: creator.</strong> Closes a drained stream and reclaims rent. The escrow token account must be empty (enforced by an account constraint) and the stream must be fully settled — either canceled, or fully withdrawn (<code>withdrawn_amount == total_amount</code>), otherwise it errors with <code>StreamNotSettled</code>.
        </p>
        <p>
          It closes the empty escrow token account and the <code>Stream</code> account, sending both rent refunds to the creator.
        </p>
      </DocBlock>

      <DocBlock id="vesting-math" title="Vesting math">
        <p>
          The unlocked amount is recomputed on every withdrawal and cancellation from the stored schedule — nothing is cached. Linear vesting uses checked <code>u128</code> arithmetic to avoid overflow when scaling by elapsed time.
        </p>
        <CodeBlock code={vestingMathCode} language="rust" filename="instructions/withdraw.rs" />
      </DocBlock>

      <DocBlock id="errors" title="Errors">
        <p>
          All custom errors returned by the program, defined as <code>VestingError</code> in <code>error.rs</code>. Anchor surfaces these by name to clients.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {errors.map(([name, message]) => (
            <div key={name} className="grid gap-3 border-b border-zinc-200 p-4 last:border-b-0 md:grid-cols-[230px_1fr]">
              <code className="font-mono text-[14px] font-semibold">{name}</code>
              <p className="text-[14px] leading-6 text-zinc-600">{message}</p>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock id="decisions" title="Architecture decisions">
        <div className="space-y-7">
          <Decision title="PDA-owned escrow">
            Locked tokens sit in a token account owned by an <code>escrow_authority</code> PDA with no private key. Only the program can move them, and only according to the vesting schedule — there is no admin key that can drain a stream.
          </Decision>
          <Decision title="Explicit vesting enum">
            The vesting rule is stored as <code>VestingType</code> and validated at creation. The program never guesses Cliff, Linear, or Milestone from timestamps, which keeps the create-time checks and the unlock math unambiguous.
          </Decision>
          <Decision title="Checked arithmetic everywhere">
            Amount math uses <code>checked_add</code>, <code>checked_sub</code>, and <code>u128</code> intermediates for the linear formula, returning <code>MathOverflow</code> rather than wrapping. An overdrawn state is treated as an error, not silently clamped.
          </Decision>
          <Decision title="Effects before interactions">
            State changes (<code>withdrawn_amount</code>, the <code>canceled</code> flag) are written before any token transfer CPI, following the checks-effects-interactions pattern to avoid re-entrancy-style bugs.
          </Decision>
          <Decision title="Settle before close">
            A stream can only be closed once its escrow is empty and it is fully settled (canceled or fully withdrawn), so rent is never reclaimed while tokens or obligations remain.
          </Decision>
        </div>
      </DocBlock>
    </DocsShell>
  );
}
