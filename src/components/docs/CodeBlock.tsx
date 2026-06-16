"use client";

import { useState } from "react";
import { Check, Clipboard, Terminal } from "lucide-react";

export type DocsLanguage = "bash" | "env" | "ts" | "rust" | "toml";

export function CodeBlock({ code, language, filename }: { code: string; language: DocsLanguage; filename: string }) {
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

function LanguageIcon({ language }: { language: DocsLanguage }) {
  if (language === "ts") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#3178c6] text-[10px] font-bold leading-none text-white" title="TypeScript">
        TS
      </span>
    );
  }

  if (language === "rust") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#b7410e] text-[10px] font-bold leading-none text-white" title="Rust">
        RS
      </span>
    );
  }

  if (language === "toml") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#9c4221] text-[9px] font-bold leading-none text-white" title="TOML">
        TOML
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

function highlightCode(code: string, language: DocsLanguage) {
  const escaped = escapeHtml(code);

  if (language === "env") {
    return escaped.replace(/^([A-Z0-9_]+)(=)(.*)$/gm, '<span class="text-rose-600">$1</span><span class="text-zinc-500">$2</span><span class="text-blue-700">$3</span>');
  }

  if (language === "toml") {
    return escaped
      .replace(/^(#.*)$/gm, '<span class="text-zinc-500">$1</span>')
      .replace(/^(\[[^\]]*\])$/gm, '<span class="text-violet-700">$1</span>')
      .replace(/^([A-Za-z0-9_.-]+)(\s*=\s*)/gm, '<span class="text-rose-600">$1</span><span class="text-zinc-500">$2</span>')
      .replace(/(&quot;[^&]*?&quot;)/g, '<span class="text-blue-700">$1</span>');
  }

  if (language === "bash") {
    return escaped
      .replace(/^(#.*)$/gm, '<span class="text-zinc-500">$1</span>')
      .replace(/\b(git|cd|npm|yarn|cargo|anchor|solana|rustc|node)\b/g, '<span class="text-violet-700">$1</span>');
  }

  if (language === "rust") {
    return escaped
      .replace(/(\/\/.*)$/gm, '<span class="text-zinc-500">$1</span>')
      .replace(/(b?&quot;[^&]*?&quot;)/g, '<span class="text-blue-700">$1</span>')
      .replace(/\b(pub|fn|let|mut|struct|enum|impl|match|if|else|return|use|mod|as|for|in|self|crate|where)\b/g, '<span class="text-violet-700">$1</span>')
      .replace(/\b(Pubkey|Result|Account|Signer|UncheckedAccount|Context|Token|TokenAccount|Mint|Program|System|VestingType|Stream|Clock|CpiContext|Transfer|u64|i64|u8|u128|bool)\b/g, '<span class="text-amber-700">$1</span>')
      .replace(/\b(true|false|Ok|Err|Some|None)\b/g, '<span class="text-rose-600">$1</span>');
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
